# Data model and catalog import

Phase 1 implements the Torob dataset schema, a deterministic sample catalog, and
an import adapter. The real Torob CSVs are now the default imported catalog, and
the sample generator remains available for deterministic tests.

## Tables

| Table | Purpose |
| --- | --- |
| `shops` | Imported shop record, structured address, weekly hours, contact channels, in-store features |
| `products` | Base product with normalized Persian title, brand, category, specs |
| `offers` | Product listed at a shop: price, price unit, warranty, last price change |
| `offer_observations` | Seller-confirmed price/stock for an offer |
| `shop_observations` | Seller-confirmed hours/notes for a shop |
| `seller_checks` | A follow-up request with token, questions, status, `viewed_at`, timestamps |

Run `npm run db:migrate` to apply `drizzle/*.sql`. The runner records applied
files in `__app_migrations` and attempts to enable `pg_trgm` (optional). Phase 4
adds `0001_seller_check_viewed_at.sql`; see `docs/seller-loop.md` for the API and
seller behavior.

### Separation rules

- Dataset values (`shops`, `products`, `offers`) are never overwritten by seller
  answers.
- `offers` has **no stock column**. Stock is only known from an
  `offer_observations` row. Without one, display «نامشخص».
- `offers.price` is the recorded price. `offers.lastPriceChangeAt` is shown
  separately as relative + absolute time; older than 14 days is stale.
- `offer_observations` and `shop_observations` are immutable confirmation
  history. Search uses only the latest offer observation and latest confirmed
  weekly hours; it never writes observations back to `offers` or `shops`.
- A visible seller link records `seller_checks.viewed_at`; a response is accepted
  once and closes the check. Expired checks are terminal.
- Every imported/generated row has `is_sample`. Real Torob rows import as
  `is_sample = false`; sample rows remain explicitly marked so they can never be
  mistaken for real shops or contacts.

### Identifiers and units

- Real Torob IDs are preserved: `shop_*`, `product_*`, `offer_*`. Sample IDs use
  `shop-0001`, `product-00001`, and `offer-00001`.
- Observations and seller checks use UUIDs. Checks also carry a separate
  `lnk_`/`sim_` capability token with a unique index.
- `price_unit` is `TOMAN` or `RIAL`. Sample data uses Toman; `price_toman` is
  imported as Toman. Comparisons normalize units at read time.
- Imported prices above `2,000,000,000` Toman are stored as `NULL` because the
  column is a PostgreSQL integer; the original value remains in the source CSV
  and the import summary counts it as invalid.
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
  accepts Persian and three-letter English day names, `HH:mm-HH:mm` strings, and
  Torob wrappers such as `{ "sat": { "status": "declared", "shifts": [...] } }`.
  A shift with `start_time`/`end_time` seconds is normalized to `HH:mm`; an empty
  wrapper becomes `null` (unknown), not closed.
- Real data has `{}` for some shops; those import as `null` (unknown).
- A confirmed `shop_observations.confirmed_hours` value overrides the dataset
  hours for display/open state until a newer confirmed value exists; the
  imported `shops.weekly_hours` stays untouched.

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

The import CLI streams three CSV files: `shops.csv`, `products.csv`, and
`offers.csv` (inside the double-nested `torob-dataset/torob-dataset/` folder in
the supplied archive). It does not load the 284 MB dataset into memory.

Real columns:

- shops: `shop_id,name,address,lat,lon,location_label,category_names,contacts,
  instagram,website_url,payment_options,supports_fast_delivery,weekly_hours`
- products: `product_id,persian_title,brand_name,category_name,model,
  image_urls,specs`
- offers: `offer_id,shop_id,product_id,seller_title,price_toman,description,
  warranty,last_price_changed_at`

Mapping rules:

- `category_names` JSON array → first activity category; `location_label` →
  landmark; `contacts` phone/website/Instagram/Payment payloads are flattened.
- `specs` JSON array (`{key,section,value}`) → object; `image_urls` JSON array →
  text array; `warranty` object → provider + months.
- Two source products without a Persian title import with a transparent
  `"(بدون عنوان)"` placeholder instead of being dropped, so their offers remain
  searchable and count-consistent.
- Missing IDs receive `import-*` fallbacks. Unknown shop/product references in
  offers are skipped and reported; the known Torob dataset has none.
- Dates must be ISO/Gregorian; Jalali parsing is deferred (D-018).

Commands:

```bash
npm run import -- --dry-run                 # validate, no DB writes
npm run import                              # local DATA_DIR or data/raw
npm run import -- --dir path/to/folder      # explicit local folder
IMPORT_URL=https://host/catalog/ npm run import   # base URL for CSVs
IMPORT_URL=https://host/catalog.zip npm run import # zip (unzip required)
```

- `DATA_DIR`/`--dir` takes precedence; otherwise `IMPORT_URL`; otherwise the
  local `data/raw/torob-dataset/torob-dataset` path.
- Import runs in one transaction: validate/map, truncate catalog and
  observations/checks, batched inserts, count verification, commit.
- It is idempotent by replacement but **destructive**: seller checks and
  observations are cleared. Do not run it after Phase 4 seller data exists
  without a backup.
- The Docker runner contains a bundled `dist/import.mjs` and `unzip`; run
  `docker compose exec app npm run import`.
- The legacy JSON shape is still supported by `mapRawCatalog` in tests, but the
  CLI is CSV-only.

## Data quality

```bash
npm run data:profile   # columns/types/samples -> docs/dataset-profile.md
npm run data:quality   # row counts/gaps/price/coords -> docs/data-quality-report.md
npm run db:report      # console summary
```

Current imported dataset: 6,476 shops, 225,903 products, 331,506 offers;
15,591 offers without price, 769 without a price date, 1,797 shops without a
category, 9,557 duplicate shop/product pairs, 0 shops outside the Tehran
bounding box. See the generated reports for the exact run data.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run db:migrate
npm run import -- --dry-run
npm run import
npm run data:quality
npm run db:report
```
