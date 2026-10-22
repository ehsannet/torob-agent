# Data-grounded shopping agent (Phase 3 + Phase 4 tools)

The assistant turns a Persian free-text request into the existing Phase 2 search
filters, runs deterministic catalog tools, and streams a short explanation. The
LLM never sees the database and never computes prices, distances, or stock; it
only chooses filters/tools and writes prose over tool output.

## Endpoints

### `POST /api/agent`

Request:

```json
{
  "message": "گوشی آیفون ۱۵ تا ۴۵ میلیون در ونک",
  "context": {
    "district": "vanak",
    "lat": null,
    "lng": null,
    "radiusKm": 5
  }
}
```

- `message`: 1–500 characters.
- `context`: optional district slug and/or browser coordinates.
- `history`: optional, max 6 short messages; reserved for a later turn model.

Response is `application/x-ndjson; charset=utf-8`, one JSON object per line:

| Event | Meaning |
| --- | --- |
| `status` | Queue/thinking/searching/answering progress |
| `delta` | A text chunk from the final answer |
| `result` | Compact `AgentResult` built from deterministic data |
| `usage` | In-memory token/cost/budget snapshot |
| `done` | `llm`, `fallback`, or `cache` |
| `error` | User-facing failure message |

The result contains at most three UI products, eight compare IDs, optional
seller checks, and optional alternatives. Prices are Toman integers; open state,
distance, and stock labels come from deterministic services. A status or
alternatives-only turn returns `kind: "seller"` with empty product lists.

### `GET /api/agent/usage`

Returns the same usage snapshot plus queue metrics. Data is process-local and
resets when the container restarts.

## Agent flow

1. Cache lookup by SHA-256 of normalized message + location context.
2. A single-slot queue (`AgentQueue`) grants one active agent request at a time;
   waiters time out after 15 seconds.
3. Budget check. If exhausted, go directly to deterministic fallback.
4. One `streamText` call with search, compare, shop-list, and seller tools (max
   5 steps). Deterministic parser hints fill category, district, budget, and flag
   fields the model omits. After a successful search, search is disabled while
   compare, shop-list, and seller tools remain active; a repeated search call
   reuses the first result so cards cannot be replaced.
5. Tool calls use the Phase 2 services. The final `AgentResult` is assembled
   from the successful tool context, not from the model text.
6. Successful LLM answers are cached for 30 minutes (max 100 entries). Answers
   containing seller checks or alternatives are never cached. Errors, empty
   text, missing tools, and budget exhaustion use a deterministic fallback
   search and explanation; a seller-only tool result is preserved.
7. Token usage is recorded once per model call; approximate cost uses the
   configured per-million prices and a $3 default budget.

`find_shops` never overwrites an existing product search result; it only adds
the shop list to the result. This keeps the cards and prose aligned.

## Tools

- `search_products`: query, category, min/max price, district, open-now, Torob
  Pay, installments, Kalabarg, fast delivery, sort, radius. Calls
  `searchCatalog` with limit 8.
- `compare_products`: 2–4 product IDs or product names. Names are resolved by
  the deterministic search service before calling the Phase 2 compare service.
- `find_shops`: product query + district/open/sort. Returns up to five offers
  and never replaces an existing product search result.
- `create_seller_check`: 1–5 offer IDs from shop output; creates tokenized
  checks with stock/price/hours/warranty questions and demo links.
- `get_seller_check_status`: token status, latest observation, timeline link,
  and alternatives.
- `suggest_alternatives`: by offer ID or token; returns same-product and similar
  in-stock options with reasons.

## Configuration

| Variable | Default |
| --- | --- |
| `LLM_BASE_URL` | `https://ai.boxapi.ir/ai/v1` |
| `LLM_MODEL` | `openai/gpt-6-luna` |
| `LLM_INPUT_PRICE_PER_MILLION` | `0.12` |
| `LLM_OUTPUT_PRICE_PER_MILLION` | `0.58` |
| `LLM_BUDGET_USD` | `3` |

The OpenAI-compatible provider sends `max_tokens`; BoxAPI's current model
requires `max_completion_tokens`, so `src/agent/config.ts` transforms the request
body. Tool calls use `reasoning_effort: "none"` (see D-020).

## Fallback

`src/agent/fallback.ts` uses `parseRequestFilters` — Persian category aliases,
district names, budget ranges (`تا`, `بین … تا`, `میلیون`, `هزار`), open-now,
delivery, installments, Kalabarg, and Toman conversion — then calls
`searchCatalog` directly. The response is labelled «جست‌وجوی جایگزین» and keeps
the same result-card contract. Search and compare remain usable without an LLM.

## Verification

```bash
npm run agent:smoke      # real provider/tool-call/usage check
npm run agent:run-smoke  # two agent runs: fresh LLM + cache hit (needs DB)
```

Manual checks in this phase: LLM answer + one product result; cache hit makes no
second model call; missing key returns fallback; queue timeout and lock release;
browser flow at `/assistant` with district context, streamed text, result card,
search link, and usage badge. Seller smoke: an explicit request created two
tokenized demo checks; a status-only result is represented as `kind: "seller"`
and skips the product/compare cards.
