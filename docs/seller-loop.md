# Seller confirmation loop (Phase 4)

The seller loop asks a physical shop to confirm stock and price before the buyer
visits. It is additive to the deterministic search: dataset prices are never
overwritten, and stock remains unknown until a seller or simulator observation
exists.

## Buyer flow

1. A product card on `/search` shows the «از فروشنده بپرس» control.
2. The buyer selects one to five shops and creates a check. The API returns one
   token/link per shop.
3. The check starts as `sent` and expires after seven days.
4. The buyer can open the seller page or copy its link. The same product group
   polls its active checks every three seconds and stops polling after all
   checks are terminal.
5. An answer writes an immutable `offer_observations` row and, when hours are
   confirmed, a `shop_observations` row. The search card and seller result card
   then show the latest confirmed stock, price, and hours.
6. An out-of-stock or unanswered check exposes alternatives from other shops.

The buyer session is a random browser-local identifier used only to list that
browser's checks. It is not authentication.

## Seller page

`/s/[token]` is public by capability token: anyone with the link can answer once.
It shows the product, shop, current questions, timeline, and alternatives after a
terminal result. Questions are:

- stock: always;
- current price: always;
- weekly hours: only when the shop has known hours;
- warranty: only when the offer has warranty data.

The response form supports in stock/out of stock, an optional Toman price,
confirming known hours, confirming warranty, and a short note. A second answer
returns `409`. Invalid, unknown, or expired tokens cannot be answered.

Opening the page records `viewed_at` and adds the visible timeline step. When a
simulated response arrives without a prior view, `viewed_at` is backfilled so the
timeline remains ordered.

## APIs

### `POST /api/seller-checks`

```json
{
  "offerIds": ["offer_123"],
  "sessionId": "s-browser-generated"
}
```

- One to five unique offer IDs, each 1–64 safe characters.
- Optional session ID of 8–80 safe characters.
- Returns `201` with `{ checks, skipped, demoMode }`; checks for the same offer
  and session are reused. Unknown offers are skipped or produce `404`.
- Each check includes `token`, `status`, `shopName`, `productTitle`,
  `priceToman`, and `linkPath`.

### `GET /api/seller-checks?sessionId=...`

Returns summaries for the browser session. It does not expose other sessions.
The response is `no-store`.

### `GET /api/seller-checks/[token]`

Returns the full seller view: shop, product, offer with latest confirmed values,
questions, timeline, latest observation, and alternatives. This endpoint also
advances a due simulated response. A missing token returns `404`.

### `POST /api/seller-checks/[token]/respond`

```json
{
  "stockStatus": "in_stock",
  "confirmedPriceToman": 12500000,
  "hoursConfirmed": true,
  "warrantyConfirmed": false,
  "note": "تا پایان هفته موجود است."
}
```

Returns the observation and status. `409` means the check already has a terminal
result; `400` means invalid input.

All seller endpoints set `Cache-Control: no-store`.

## Tokens and security

- Tokens are prefixed by channel: `lnk_` for a copied link, `sim_` for the
  simulator. The random part is 24 URL-safe bytes.
- The token is the only credential for the public seller page. It is not a
  replacement for real shop authentication; do not expose sensitive data via a
  check.
- Checks expire after seven days and only one response is accepted.
- `APP_BASE_URL` controls the absolute link returned by the API. It defaults to
  the Compose `http://localhost:3000` value and must be a reachable public URL in
  deployment.

## Demo mode

`DEMO_MODE=true` is the default for local/Compose use. Checks then go through the
link channel with a simulated seller and a deterministic plan derived from the
token:

- 55%: in stock, confirming the recorded price and hours when present;
- 25%: out of stock, confirming the same price;
- 20%: no answer, which expires the check.

The result appears after 6–12 seconds and only advances when a status, seller
page, or polling request is made. There is no background timer or daemon, which
keeps the free server single-process and immutable.

`/dev/seller-simulator` is enabled only in demo mode. It lists recent simulator
checks and allows a manual in-stock/out-of-stock response during the delay. The
simulator is deterministic at the API level but uses a random token per check.

With `DEMO_MODE=false`, checks use the link channel and wait for a seller page
response; the simulator is unavailable.

## Observations

- `offer_observations` stores `stock_status`, optional confirmed price, note,
  source (`seller_response` or `simulator`), and timestamp.
- `shop_observations` stores optional confirmed weekly hours, note, source, and
  timestamp.
- Only the latest offer observation is shown. Dataset `offers.price` and
  `shops.weekly_hours` are not modified.
- A confirmed price in RIAL is normalized to Toman at read time.
- A confirmed weekly-hours observation overrides the dataset hours for display
  and open-state computation, but does not rewrite `shops.weekly_hours`.
- Stock is `unknown` until an observation exists. An old observation remains
  visible with its relative timestamp.

`viewed_at` is stored on `seller_checks` by migration
`drizzle/0001_seller_check_viewed_at.sql`; schema migrations must run before the
new pages are used.

## Timeline

The public view has five steps: created, link ready/sent, viewed, answered, and
expired. `viewed_at` is optional but is backfilled by auto/manual responses.
Terminal checks show failed pending steps rather than pretending they happened.

## Alternatives

After an out-of-stock answer or expiration, `loadAlternativesForOffer` returns up
to four options:

1. the same product at another shop, in stock and not the current shop;
2. similar products in the same category/brand, within ±40% of the price, with
   stock not out and the current offer excluded.

Each option carries a reason and the source is labelled «داده ثبت‌شده». An
alternative is not a seller-confirmed offer unless it has its own observation.

## Agent tools

The assistant has three seller tools:

- `create_seller_check`: one to five offer IDs from a prior shop search;
- `get_seller_check_status`: token status, latest observation, and alternatives;
- `suggest_alternatives`: by offer ID or token.

A status/alternative-only answer is returned as an `AgentResult` with
`kind: "seller"` even when no product search happened. Results containing seller
checks or alternatives are not cached, so polling and links stay current. The
agent result card lists the checks, statuses, and token links and renders
alternatives.

## Configuration

| Variable | Purpose |
| --- | --- |
| `APP_BASE_URL` | Absolute base for seller links |
| `DEMO_MODE` | Enables the deterministic simulator and `/dev/seller-simulator` |

## Verification

```bash
npm run typecheck
npm test
npm run lint
npm run build
curl -X POST http://localhost:3000/api/seller-checks \
  -H 'content-type: application/json' \
  -d '{"offerIds":["offer_..."],"sessionId":"manual-smoke-session"}'
```

Runtime checks cover demo auto-answer, manual response, expiration with
alternatives, duplicate `409`, viewed timestamps, search-card confirmation
counts, seller-page rendering, and agent-created checks. See `PROGRESS.md` for
the recorded results.

## Limitations

- There is no real outbound SMS/WhatsApp delivery; the buyer copies a link.
  `channel.ts` keeps the seam for a future provider.
- Simulated timing advances on polling, not on a background scheduler.
- Seller identity is not verified; a capability link is sufficient to answer.
- Importing the catalog is destructive and clears checks/observations. Back up
  before re-importing after using the seller loop.
