# Data model and sample catalog

Phase 1 implements the provisional Torob dataset schema, a deterministic sample
catalog, and an import adapter. The real files can replace the sample data
without changing application code.

## Tables

| Table | Purpose |
| --- | --- |
| `shops` | Imported shop record, structured address, weekly hours, contact channels, in-store features |
| `products` | Base product with normalized Persian title, brand, category, specs |
| `offers` | Product listed at a shop: price, price unit, warranty, last price change |
| `offer_observations` | Seller-confirmed price/stock for an offer |
| `shop_observations` | Seller-confirmed hours/notes for a shop |
| `seller_checks` | A follow-up request with token, questions, status, timestamps |

Run `npm run db:migrate` to apply `drizzle/*.sql`. The runner records applied
files in `__app_migrations` and attempts to enable `pg_trgm` (optional).

### Separation rules

- Dataset values (`shops`, `products`, `offers`) are never overwritten by seller
  answers.
- `offers` has **no stock column**. Stock is only known from an
  `offer_observations` row. Without one, display «نامشخص».
- `offers.price` is the recorded price. `offers.lastPriceChangeAt` is shown
  separately as relative + absolute time; older than 14 days is stale.
- Every imported/generated row has `is_sample`; the UI must label sample data.

### Identifiers and units

- Shops: `shop-0001`; products: `product-00001`; offers: `offer-00001`.
- Observations and seller checks use UUIDs.
- `price_unit` is `TOMAN` or `RIAL`. Sample data uses Toman. Import detects the
  unit from the source text; comparisons must normalize units in Phase 2.
- Coordinates are `double precision`; distances will use the haversine formula
  (no PostGIS).

## Weekly hours

`shops.weekly_hours` is JSON:

```json
{
  "saturday": [{ "open": "09:00", "close": "21:00" }],
  "friday": []
}
```

- Keys are `saturday` … `friday`.
- Values are arrays to support split shifts.
- `null` means unknown; `[]` means closed.
- Times are `HH:mm` in `Asia/Tehran`.
- `src/lib/hours.ts` validates this shape; `parseHours` in the import layer also
  accepts Persian day names and `HH:mm-HH:mm` strings.

## Persian normalization

`normalizePersian` in `src/lib/persian.ts`:

- NFKC normalization;
- Arabic `ي`/`ى` → `ی`, `ك` → `ک`, alef variants → `ا`, `ة` → `ه`;
- Persian/Arabic digits → ASCII;
- removes diacritics and tatweel;
- converts ZWNJ/ZWJ/NBSP to a space;
- lowercases Latin;
- collapses whitespace and trims.

Every `name_normalized`, `address_normalized`, `title_fa_normalized`,
`brand_normalized`, and `seller_title_normalized` value uses it. The function is
idempotent. Display helpers convert numbers back to Persian digits.

## Sample generator

`generateSampleDataset()` in `src/data/sample/generate.ts` uses a seeded PRNG
(default seed `20261022`) and produces:

- 300 shops across 20 Tehran districts and several malls; approximate district
  coordinates plus jitter;
- 2,000 products: 8 categories × 250, with brand/model/variant combinations;
- 4,000 offers: 14 for the first 100 shops, 13 for the rest.

Deliberate gaps include unknown hours, missing coordinates, low-confidence
addresses, missing prices, missing last-price-change dates, and stale prices.
Names, phones, and social handles are fictional (`example.com` / sample
handles). Never present them as real contact information.

Regenerate:

```bash
npm run db:seed          # truncate and regenerate
npm run db:seed:if-empty # seed only when the catalog is empty
npm run db:report        # counts and data-quality gaps
```

## Import adapter

Input JSON:

```json
{
  "shops": [{ "id": "shop-1", "name": "...", "address": "..." }],
  "products": [{ "id": "product-1", "title_fa": "...", "category": "..." }],
  "offers": [{ "id": "offer-1", "shop_id": "shop-1", "product_id": "product-1", "price": "..." }]
}
```

- All field aliases (English/Persian) are in `src/data/import/mapping.ts`.
- Missing IDs get `import-*` fallbacks; missing shop names/product titles are
  rejected with a row index.
- Duplicate IDs and unknown shop/product references are rejected before writes.
- `npm run db:import -- path/to/dataset.json --dry-run` validates without
  touching the database; omit `--dry-run` to replace the catalog.
- Import replaces the entire catalog, including observations and seller checks.
- Dates must be ISO/Gregorian in this phase.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run db:migrate && npm run db:seed && npm run db:report
```
