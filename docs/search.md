# Search and compare contract

Phase 2 is deliberately LLM-free. The UI and both APIs call the same services:

- `src/server/search.ts` — filtering, grouping, sorting, and page slicing.
- `src/server/compare.ts` — 2–4 product comparison and deterministic reasons.

## Search API

`GET /api/search`

| Parameter | Type | Default | Notes |
| --- | --- | --- | --- |
| `q` | string | empty | Normalized Persian/Latin text; up to 100 chars. |
| `category` | string | all | Exact imported category label, e.g. `گوشی موبایل` or `دوربین مدار بسته`. |
| `minPrice` / `maxPrice` | integer | none | Toman; RIAL offers are converted before filtering. |
| `district` | slug | none | One of `TEHRAN_DISTRICTS` in `src/lib/tehran.ts` (e.g. `ferdowsi`, `vanak`). Matches the imported `location_label` first, then the normalized address. |
| `lat` / `lng` | number | none | Must be supplied together. |
| `radiusKm` | number | 5 | 0.5–30; only used with coordinates. |
| `openNow` | `1`/`true` | false | Includes open and closing-soon shops. |
| `torobPay` | `1`/`true` | false | Shop accepts Torob Pay. |
| `installments` | `1`/`true` | false | Shop offers installments. |
| `kalabarg` | `1`/`true` | false | Shop accepts Kalabarg. |
| `fastDelivery` | `1`/`true` | false | Shop has fast delivery. |
| `sort` | enum | `relevance` | `relevance`, `price`, `distance`, `newest`. |
| `page` | integer | 1 | 1–1000. |
| `limit` | integer | 12 | 1–24. |

Invalid values return HTTP `400` with `{ "error": "..." }`. Successful responses
are `no-store` JSON and carry `demo: false` for imported Torob data.

Response outline:

```json
{
  "filters": { "q": "iPhone 15", "district": "vanak", "page": 1, "limit": 12 },
  "groups": [
    {
      "product": { "id": "product-00031", "titleFa": "...", "brand": "Apple" },
      "offers": [
        {
          "priceToman": 12880000,
          "recordedPrice": 12880000,
          "lastPriceChangeAt": "2026-10-20T...",
          "stalePrice": false,
          "openStatus": { "state": "open", "label": "باز است" },
          "distanceKm": 1.2,
          "stockStatus": "unknown",
          "hoursConfirmedAt": null,
          "features": { "torobPay": true }
        }
      ],
      "priceMin": 12880000,
      "priceMax": 15720000,
      "shopCount": 5,
      "openNowCount": 2,
      "confirmedStockCount": 0,
      "reasons": ["قیمت از ...", "۲ فروشگاه همین حالا باز است"]
    }
  ],
  "totalGroups": 24,
  "totalOffers": 56,
  "categories": [{ "value": "گوشی موبایل", "label": "گوشی موبایل", "count": 814 }],
  "priceBounds": { "min": 1000000, "max": 500000000 },
  "tookMs": 44,
  "demo": false
}
```

## Semantics

- **Grouping.** Offers are grouped by `product_id`; a group exposes up to six
  matching shop offers for display, while `offerCount`, `shopCount`, price
  bounds, open-shop count, and latest price-change timestamp cover all matching
  offers. Empty query/category requests use a database-side grouped
  `LIMIT/OFFSET` page so the 331k-offer catalog is not loaded into memory.
  Browse pages are disjoint; global relevance for browse is approximated by
  offer count before the page is ranked.
- **Prices.** `priceToman` is derived from the offer unit (RIAL ÷ 10). Null
  prices stay null and display as «نامشخص»/«ثبت نشده». Budget filters exclude
  null prices.
- **Transparency.** `recordedPrice` is the imported/displayed price;
  `confirmedPriceToman` and `stockStatus` come only from the latest
  `offer_observations` row. No observation means `unknown`, never “in stock”.
  `hoursConfirmedAt` is set when the latest `shop_observations` row confirmed
  hours; the effective hours then override the dataset value for open-state.
- **Hours.** `openStatus` is computed in `Asia/Tehran`, supporting multiple
  ranges and ranges that cross midnight. Empty ranges mean closed; missing
  `weekly_hours` means unknown. Closing within 60 minutes is
  `closing_soon`.
- **Distance.** Haversine. Without coordinates or a district, distances are
  null. A district matches the imported `landmark`/`location_label`, then the
  address text; “near me” uses coordinates and a SQL bounding box followed by an
  exact haversine filter.
- **Open now.** The SQL candidate query and TypeScript card mapping both apply
  `Asia/Tehran` weekly-hours rules, including split and overnight shifts.
- **Categories.** Facets are capped at the 40 largest product categories plus
  the selected category; counts are per product, not per offer.
- **Ranking.** Default relevance favors more open shops, then nearer shops,
  more sellers, and lower price. Price/distance/newest sorting use the
  corresponding group value with nulls last.

## Compare API

`GET /api/compare?ids=id1,id2&...`

- `ids`: 2–4 unique product IDs (comma-separated).
- Location context (`lat`, `lng`, `radiusKm`, `district`) is optional and uses
  the same rules as search. Query/category/budget parameters are accepted for
  back-link continuity but do not filter the compared products.
- Response: `{ groups, recommendation, demo }`. `recommendation` contains the
  winning product ID/title and up to four reasons. The score uses price,
  distance, open shops, shop count, confirmed stock, and price freshness.
- This recommendation is a deterministic data rule, not an LLM judgment.

## UI routes

- `/` — entry, search, categories, transparency explainer.
- `/search` — grouped results, filters, shop cards, compare selection. Without
  a query/category it shows a paginated browse view rather than scanning every
  offer.
- `/compare` — side-by-side columns, winner banner, full comparison table.

All three routes work with the database only; no model configuration is needed.
