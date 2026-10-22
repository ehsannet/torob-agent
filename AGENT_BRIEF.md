# BUILD BRIEF — "Torob In-Store Shopping Assistant" (hackathon project)

You are the lead engineer building this project end to end. Read this whole file before writing any code. Re-read the relevant section before starting each phase.

---

## 0. How you must work (read first)

1. **Work in phases** (section 12). Finish a phase, run it, verify its acceptance criteria, commit, then move on. Never start the next phase on top of a broken one.
2. **Keep memory files in the repo root** so progress survives context resets:
   - `PROGRESS.md` — what is done, what is next, known bugs. Update after every phase.
   - `DECISIONS.md` — every assumption or deviation you make, with a one-line reason.
3. **Do not stop to ask questions** unless you are truly blocked (e.g. missing credential). Make a reasonable assumption, log it in `DECISIONS.md`, continue.
4. **Small files, small commits.** No file over ~300 lines. Commit after each working step with a clear message.
5. **Verify by running.** After each phase, start the app, exercise the feature, and fix errors. Do not claim something works without running it.
6. **Secrets:** never hardcode or commit API keys. Keep `.env` in `.gitignore`. Provide `.env.example`. The LLM key must only ever be used server-side. **Never read, print, log, or ask for the contents of `.env`** (the user fills it in locally; you only read `.env.example`). Never paste real keys into code, commits, chat replies, or test fixtures. For smoke tests, read the key from `process.env` at runtime without echoing it.
7. **Time is very limited.** Priority is a complete, polished core flow (the 4 steps below) that demos reliably. Extra features come last and only if the core is solid.
8. Reply to the user in Persian, short and clear. Code, comments, and docs in English. All **user-facing UI text in Persian**.

---

## 1. Goal

Build a **mobile-first Persian (RTL) web app (PWA)** with an **agentic shopping assistant** that helps a person buy **in person** from small and large shops, malls, and bazaars in **Tehran**, using Torob's dataset of shops and product offers.

The assistant must help the user: decide what to buy, compare options, find a shop nearby that really has it, **ask the shop** (price / stock / hours), get an **exact address** (mall, floor, unit), and handle problems (out of stock → alternatives).

Not every flow has to go through chat. Cards, filters and buttons must let the user move forward without re-typing.

---

## 2. The four steps of the assistant (product flow)

1. **Understand the need** — the assistant learns what the user wants: product/type, budget, area (or location + radius), and purchase conditions (open now, Torob Pay in-store, installments, کالابرگ, fast delivery).
2. **Compare and recommend** — search products, compare options/models side by side, and recommend with a clear reason ("why this one") and a clear next step.
3. **Find the seller and follow up** — find shops in the chosen area that carry the product, then **ask the shop** about current price, stock and opening hours. The assistant tracks the request and updates product/shop info from the answers.
4. **Exact address and visit** — give a precise address (mall name, floor, unit when available), opening status, and a route link. If the item is unavailable, **suggest alternatives** (same product at another nearby shop, or a similar product).

---

## 3. How the project is judged (300 points) — use this to prioritize

| Criterion | Pts | What it means for you |
|---|---|---|
| Product | 75 | Truly solves in-person shopping: search, compare, find seller in range, follow-up. Covers all four steps. |
| UX / UI | 75 | Easy, smooth, mobile, Persian RTL. User moves forward without friction. |
| Intelligence | 50 | Seller follow-up, alternatives when unavailable, awareness of visit conditions (time, location, need). |
| Deploy | 40 | Stable deployment on the provided server, works in production. |
| Technical | 40 | Code structure, right tools, performance, scalability. |
| Dataset | 20 | Data used correctly; information shown transparently. |

Also: a **~5-minute demo video is mandatory** (shows output, not source code). So the app must have a reliable, scripted demo path (section 12, phase 8).

Product and UX matter most. Scalable engineering is secondary to a great product and UX.

---

## 4. Dataset facts and traps (very important)

The real Torob dataset **will be delivered later**. Build against a **provisional schema + generated sample data**, behind an **import adapter**, so swapping in the real files is one step. Real column names are unknown — keep mapping in one file (`src/data/import/mapping.ts`).

Tables: `shops`, `products`, `offers`. Fields expected (some missing for many rows):

- **Shop:** id, name, business type, activity category, description, images, history on Torob and registered licenses, text address, coordinates, location notes (mall name, floor, unit — wherever recorded in the address), weekly opening hours, contact channels (phone, WhatsApp, Bale), Instagram/website, Torob Pay in-store acceptance, installment services, کالابرگ support, fast delivery.
- **Product (base product):** id, Persian and English title, brand, category, technical specs, description, images.
- **Offer (product in store):** shop↔product link, seller's own title and description, price and price unit, warranty provider and duration, **last price-change time**.

Known facts about the data (design for them):
- ~6,476 shops, all in Tehran; only ~10% of Tehran shops and only selected districts → **coverage gaps exist**. If there are no shops in the user's area, say so honestly; never invent results.
- **Most shop names (6,364 of 6,476) are fake. All phone numbers are fake.** Coordinates and other info are real. Only ~112 shops have real names (those with an Instagram or website link). → Show names as given, but **never present phone numbers as real/callable**. Seller contact happens inside the app (section 7).
- Each shop has at most 300 products. About 225,903 unique products and 331,506 offers. Data is about a week old.
- **A shop's activity category alone does NOT mean it has a given product.** Only an actual offer proves the shop lists that product.

### Transparency rules (these directly affect score — implement everywhere)
Never merge these three different things; show each separately with a clear label:
1. **Recorded price** (`قیمت ثبت‌شده`) — from the dataset.
2. **Last price change** (`آخرین تغییر قیمت`) — shown as relative time ("۳ روز پیش") and absolute date.
3. **Confirmed stock** (`موجودی تأییدشده`) — only true if a seller answered through the app. Otherwise show **`نامشخص`** (unknown), never "موجود".

Also: show unknown/missing fields explicitly ("ساعت کاری نامشخص", "گارانتی نامشخص"). Show a stale-price warning when the last change is old (e.g. > 14 days). Mark generated sample data as sample in dev builds.

### Persian text handling
Normalize before indexing and searching: Arabic `ي`→`ی`, `ك`→`ک`, unify Persian/Arabic/Latin digits, strip tatweel and diacritics, handle ZWNJ (half-space), lower-case Latin. Display numbers with Persian digits and thousands separators. Check the price unit in the data (toman vs rial) and show it clearly; log your assumption in `DECISIONS.md`.

---

## 5. Tech stack (decided — do not change without logging in DECISIONS.md)

- **One full-stack app:** Next.js (App Router) + **TypeScript**. UI, API routes and the agent live in one project and one Docker image.
- **Database:** PostgreSQL. ORM: Prisma (or Drizzle if you prefer; pick one). Use `pg_trgm` for fuzzy Persian search **only if** the extension is available; otherwise fall back to normalized `LIKE`/full-text. **Do not require PostGIS** — compute distance with the haversine formula (data is small).
- **Styling:** Tailwind CSS + shadcn/ui components. **Self-host fonts** (Vazirmatn). No runtime dependency on external CDNs (the app runs on an Iranian host).
- **Map:** Leaflet or MapLibre. Map tiles may be slow/blocked → the app **must work without the map** (address text + deep links to Neshan / Balad / Google Maps). Map is an enhancement.
- **Agent:** Vercel AI SDK (`ai` + `@ai-sdk/openai-compatible` + `zod`) with tool calling and streaming. Write the agent logic yourself on top of it. Do not pull in a heavy agent framework.
- **Time:** timezone `Asia/Tehran`. Show Jalali dates (use `Intl` with `fa-IR-u-ca-persian` or dayjs + jalaliday).
- **Deploy target:** Docker container on Liara (see section 11).

---

## 6. LLM configuration and constraints (read carefully — this is where projects break)

Environment variables:
```
LLM_BASE_URL=        # BoxAPI base URL (must be OpenAI-compatible; verify)
LLM_API_KEY=         # server-side only
LLM_MODEL=gpt-6-luna          # default: cheapest allowed model
LLM_MODEL_HARD=gpt-6-sol      # optional: rarely, only for hard comparison steps
EMBEDDING_MODEL=text-embedding-3-small   # optional enhancement (see section 8)
```
Make the model names configurable so they can be swapped in one line.

**Models actually available on this account (organizers' list; nothing else works — DeepSeek, Gemini, Claude, Qwen etc. are NOT available):**
`gpt-6.1-sol`, `gpt-6-astra`, `gpt-6-luna`, `gpt-6-sol`, `gpt-5-mini`, `gpt-5.6-luna`, `gpt-5.6-terra`, `gpt-5.6-sol`, `gpt-5.4-mini`, `gpt-5.3-codex`, `text-embedding-3-small`, `text-embedding-3-large`.

Cost guidance (approximate, per 1M tokens, input/output): `gpt-6-luna` is the cheapest at roughly $0.12 / $0.58 on this provider → use it for everything by default. `gpt-6-sol` is about 20x more expensive and `gpt-6-astra` / `gpt-6.1-sol` are far more expensive → **never use astra or 6.1-sol**, and use sol only for rare hard cases. The model ID format the provider expects (`gpt-6-luna` vs `openai/gpt-6-luna`) must be confirmed by the smoke test.

**Hard constraints of the provided API account:**
- **Only 1 concurrent request is allowed.** Put **all** LLM calls behind one global queue (concurrency = 1) with timeout and retry. If the queue is busy, the UI shows a friendly Persian "در صف پردازش…" state. Never fire parallel LLM calls.
- **Tiny budget (~$3 total for the whole project, including demo and judging).** Therefore:
  - Do **not** use the LLM for search, filtering, sorting, distance, or opening hours. SQL/code does that.
  - Use the LLM only for: understanding the request (→ structured JSON), explaining recommendations, writing the message to the seller, summarizing, and hard comparisons.
  - Keep the system prompt short. Send only the last few messages. Keep tool outputs compact (top ≤ 8 results, only needed fields).
  - Set `max_tokens`. Prefer non-thinking / low reasoning mode if the API supports it.
  - **Cache** identical requests (e.g. normalized query → parsed intent) in the DB or memory.
  - Log token usage per request and keep a running cost counter visible in dev.
- **The app must degrade gracefully:** if the LLM fails or the budget is gone, the user can still search with text + filters and use all cards/buttons. Chat is a convenience, not a dependency.
- **Tool-calling reliability:** validate every tool argument with zod; on malformed output, retry once with a short correction; cap the agent loop at 5 steps; never let the loop run unbounded.
- **First task, before building features:** write `scripts/llm-smoke-test.ts` that checks, against the real endpoint: (a) a plain chat completion, (b) streaming, (c) a tool call with a JSON schema, (d) a Persian prompt, (e) which endpoint style works: `/chat/completions` and/or `/responses`, (f) the exact model ID format accepted (`gpt-6-luna` vs `openai/gpt-6-luna`; try `GET /models` if available), (g) whether a reasoning-effort setting is accepted (use the lowest effort for routine calls; hidden reasoning tokens cost money). Report the results. If tool calling or streaming does not work, tell the user immediately and adapt (e.g. JSON-mode parsing instead of native tools). Choose the AI SDK provider package from the result: `@ai-sdk/openai-compatible` for chat completions, or `@ai-sdk/openai` with a custom `baseURL` if only `/responses` works.


---

## 7. Domain model and the seller follow-up loop

### Internal data model (keep dataset values and confirmations separate)
- `Shop`, `Product`, `Offer` — imported dataset values (never overwritten by confirmations).
- `OfferObservation` — a confirmation from a seller: `offerId`, `confirmedPrice?`, `stockStatus` (`in_stock | out_of_stock | unknown`), `note?`, `confirmedAt`, `source` (`seller_response | simulator`).
- `ShopObservation` — confirmed opening hours or notes, with `confirmedAt`.
- `SellerCheck` — one request to a shop: `id`, `token`, `shopId`, list of questions (stock, price, hours, warranty), `status` (`created | sent | answered | expired`), timestamps, optional link to a user session.
- Display rule: show the **latest confirmed observation** if it exists (with its time), otherwise the dataset value with the "ثبت‌شده در دیتاست" label.

### Seller follow-up (core of "Intelligence" score)
Real phone numbers are fake, so real messaging is impossible. Build it through a **channel abstraction**:
- `SellerChannel` interface: `send(check)`.
- `LinkChannel` (real, default): generates a unique seller link `/s/[token]` the user/agent can share (copy, QR, share sheet). The seller opens a light mobile page and answers with **one tap per question** (موجود / ناموجود / قیمت جدید، ساعت کاری).
- `SimulatorChannel` (demo): auto-answers after a short delay with realistic, scripted outcomes (some in stock, some out of stock, some no answer), controlled by a **demo mode** switch, and a manual "respond as seller" panel at `/dev/seller-simulator`.
- Keep the interface ready for future `BaleChannel` / `WhatsAppChannel`.

User-side experience for a check: a clear **status timeline** (ارسال شد → دیده شد → پاسخ داده شد / بدون پاسخ). If the answer is "out of stock" or there is no answer after a timeout, the assistant **automatically proposes alternatives** (section 8, step 4). When an answer arrives, update the product/shop display immediately and write an observation record.

The assistant composes the seller message with the LLM (short, polite Persian), but the structured questions come from code.

---

## 8. Features per step, with acceptance criteria

### Step 1 — Understand the need
- A `SearchContext` state object: query text, category, budget range, area (district or map point + radius km), conditions (`openNow`, `torobPay`, `installments`, `kalabarg`, `fastDelivery`).
- UI: chat box **plus** quick chips and filter bottom sheet. Changing budget/area/conditions re-runs the search instantly **without retyping and without calling the LLM**.
- The LLM turns free text into a `SearchContext` JSON (zod-validated). If it fails, fall back to plain keyword search.
- Location: ask for geolocation permission; if denied, let the user pick a district or drop a pin. Never block on location.
- Accept: user can go from a vague sentence to filtered results in ≤ 2 interactions.

### Step 2 — Compare and recommend
- Search products (normalized Persian query), group offers by base product.
- Product cards: image, title, brand, price range among nearby shops, number of nearby shops, and the three-way price/time/stock labels (section 4).
- **Compare view** for 2–4 products or 2–4 offers: specs side by side, price, distance, open status, confirmation status. Highlight differences.
- **Recommendation with reasons:** a short "چرا این؟" line (cheapest nearby / closest / open now / confirmed in stock / accepts Torob Pay) built from data first; the LLM may rephrase it. Always show the next step button ("از فروشنده بپرس", "مسیر").
- Handle ambiguity: if a query matches many models, ask one focused clarifying question or offer chips.
- Accept: compare two products and see why one is recommended, with correct labels.

### Step 3 — Find sellers and follow up
- Shop list sorted by a transparent score (distance, price, open now, confirmation); show why.
- Shop card: name (as given), mall/floor/unit if known, distance, open/closed/closing soon, payment features, price label trio.
- "Ask seller" creates a `SellerCheck` (section 7). Support asking several shops at once for the same product.
- Status timeline, notifications in-app (poll or SSE), and automatic updates of the displayed data on answer.
- Accept: full loop works in demo mode — create check → simulated answer → card updates with `موجودی تأییدشده` and time.

### Step 4 — Exact address, visit plan, alternatives
- **Structured address:** extract `mallName`, `floor`, `unit`, `street`, `landmark` from the address text. Use **rules/regex first** (`پاساژ|مجتمع|برج|بازار|طبقه|همکف|زیرزمین|واحد|پلاک`), and use the LLM only for leftovers, **once at import time** in batches, with cached results. Store a confidence value; when low, label it "آدرس تقریبی".
- Show opening status using `Asia/Tehran` time: باز است / به‌زودی بسته می‌شود / بسته است / نامشخص; show today's hours.
- Route: deep links (Neshan, Balad, Google Maps) from coordinates; copy-address button. Works without the map widget.
- **Alternatives (Intelligence):** if out of stock or no answer → (a) same product at other nearby shops (prefer open now, confirmed), (b) similar products (same category/brand, close specs/price). Explain each suggestion.
- **Visit conditions:** consider current time vs. closing time and distance; warn "تا بسته شدن X دقیقه مانده".
- Optional if time remains (design for it, do not build first): multi-shop trip order, "hold item" request, reminder, price history, and **embedding-based similar-product search** (`text-embedding-3-small` is available and very cheap): embed product titles once in batches at import time, store vectors in Postgres (use `pgvector` only if the extension exists; otherwise store arrays and compute cosine similarity in code over a pre-filtered candidate set), and use it for "similar product" alternatives and fuzzy Persian queries. Cache everything; never embed at request time except the user's short query.
- Accept: from a chosen shop the user gets mall/floor/unit (or an honest "approximate" label), open status, and route links.

### Agent tools (keep each in its own module under `src/agent/tools/`)
`parse_request`, `search_products`, `compare_products`, `find_shops`, `create_seller_check`, `get_seller_check_status`, `suggest_alternatives`, `get_visit_plan`. Each tool: zod input schema, small JSON output, no side effects except `create_seller_check`. Adding a feature later = adding a tool + a card.

---

## 9. UX requirements

- **Mobile first** (360–430 px), then desktop. `dir="rtl"`, use logical CSS properties (`ms-*`, `me-*`, `text-start`) so nothing breaks in RTL.
- Persian digits and typography, Vazirmatn, comfortable line height, large tap targets (≥ 44 px), sticky bottom action bar for the main next step.
- Fast: skeleton loaders, optimistic UI, streamed assistant text, no layout jumps. Target first load fast on a mid-range phone; avoid heavy libraries.
- Every screen has designed **empty, loading, error and "no result in this area"** states in natural Persian.
- Every result answers: *why am I seeing this* and *what do I do next*.
- Short, natural Persian microcopy. No English in the UI except brand/model names.
- PWA: manifest, icons, theme color, installable. No offline requirement.
- Accessibility basics: contrast, labels, focus states.

---

## 10. Visual design — follow Torob's look and feel

Make the app **feel like part of Torob** so judges recognize the brand language.

1. **Study the real Torob website and mobile web** (torob.com) as a normal user: home, search results, product page, shop list. If you have a browser/screenshot tool, open it and capture screenshots. **If you cannot browse, do not guess colors — ask the user for screenshots** and wait for them while you work on non-visual parts.
2. Extract and record in `docs/design-tokens.md`: color palette (primary, accents, backgrounds, text, borders, success/warning/error), typography feel and sizes, border radius, shadows, spacing scale, card layout, button styles, icon style, and the tone of Persian microcopy.
3. Implement them as **design tokens** (Tailwind theme / CSS variables) in a single place so the whole look can be adjusted in one file.
4. **Inspiration, not copying:** reproduce the visual language (colors, spacing, component style), but do **not** copy their HTML/CSS/JS, images, logo files or text, and do not hotlink their assets. Use a simple text wordmark or placeholder as logo.
5. Don't clone Torob's functionality. Only the look and UX patterns; our product is the in-store assistant.

---

## 11. Deployment (Liara, Docker) — prepare from day one

- `Dockerfile` (multi-stage, Next.js `output: "standalone"`), `docker-compose.yml` for local (app + postgres), `.dockerignore`.
- App listens on `0.0.0.0` and uses `PORT` from the environment.
- `GET /api/health` returns 200 with DB connectivity status.
- Migrations run automatically on start (e.g. `prisma migrate deploy`), plus an idempotent seed/import command.
- All config via env vars, documented in `.env.example`: `DATABASE_URL`, `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_MODEL_HARD`, `APP_BASE_URL`, `DEMO_MODE`.
- No dependence on local disk for persistent data. Logs to stdout.
- No external CDN at runtime. Only external call: the LLM API (and optional map tiles).
- Write `DEPLOY.md` with exact steps for Liara and a pre-deploy checklist.
- **First deploy early** (right after phase 0) with a minimal page, to confirm the server can reach the LLM API and the database. Do not leave deployment to the end.

---

## 12. Phases (do in order)

**Phase 0 — Skeleton (deploy-ready).** Next.js + TS + Tailwind + RTL + Vazirmatn; Docker + compose; `/api/health`; `.env.example`; LLM smoke test script; `PROGRESS.md`, `DECISIONS.md`. *Accept:* `docker compose up` works; health OK; smoke test results reported.

**Phase 1 — Data.** Schema, migrations, Persian normalization utils (with unit tests), **sample data generator** (≈300 Tehran shops across several malls/districts with real-looking coordinates, ≈2,000 products, ≈4,000 offers, deliberately including missing fields, stale prices, shops without hours, low-confidence addresses), and the import adapter. *Accept:* seed runs; counts correct; tests pass.

**Phase 2 — Search and compare without LLM.** Search API, filters, grouping, distance, open-now logic (unit tested), compare API; UI: home, results, product card, filter sheet, compare view, shop card with the transparency labels. *Accept:* full flow usable with zero LLM calls.

**Phase 3 — Agent.** LLM client, queue (concurrency 1), cache, token logging, intent parsing, tools, streamed chat, explanation of recommendations, fallback when LLM is down. *Accept:* free-text request → filtered results → explained recommendation; works with the queue; budget logging visible.

**Phase 4 — Seller loop.** `SellerCheck`, seller page `/s/[token]`, channels, simulator, status timeline, observation updates, alternatives on out-of-stock/no answer. *Accept:* full loop in demo mode.

**Phase 5 — Visit plan.** Structured address extraction (rules, then cached LLM leftovers), opening status, route links, visit-condition warnings. *Accept:* every shop card/detail shows address detail and open status correctly.

**Phase 6 — Polish.** Match Torob look (section 10), all empty/error/loading states, PWA, performance pass, Persian copy review. *Accept:* looks consistent and professional on a 390 px screen.

**Phase 7 — Real data + deployment.** When the real dataset arrives: update `mapping.ts`, import, run a **data-quality report** (counts, missing fields, price-unit check, coordinates in Tehran bounds, duplicate handling), reindex, re-run address extraction. Deploy to Liara; verify health and LLM access from the server. *Accept:* production URL works end to end.

**Phase 8 — Demo support.** A deterministic **demo scenario** with `DEMO_MODE=true`: one polished storyline covering all four steps (e.g. user wants a product under a budget near a district → compare → ask 2 shops → one answers "out of stock" → alternative suggested → exact address and route). Include a **reset button** to restore the demo state, and a `DEMO_SCRIPT.md` (step-by-step shots for the 5-minute video).

---

## 13. Pitfalls — do NOT do these

- Don't call the LLM for things SQL/code can do; don't call it on every keystroke; don't run parallel LLM calls.
- Don't show "in stock" without a seller confirmation. Don't present fake phone numbers as real. Don't invent shops, prices or addresses.
- Don't merge recorded price, price-change time, and confirmed stock into one label.
- Don't hardcode the API key or expose it to the browser. Don't commit `.env`.
- Don't depend on external CDNs, Google Fonts, or the map for the app to function.
- Don't use physical CSS (`left/right`, `ml/mr`) where logical properties exist; verify RTL on every screen.
- Don't use UTC for opening hours; use `Asia/Tehran`.
- Don't build extra features before the four-step core is complete and polished.
- Don't write huge files or skip tests for critical logic: normalization, open-now, address extraction, price/stock labeling.
- Don't leave the app unrunnable at the end of a phase.

---

## 14. Definition of done

- All four steps work end to end on a phone-sized screen in Persian RTL, on the deployed URL.
- Transparency rules (section 4) are visible on every card.
- The seller loop works, including the no-answer and out-of-stock paths with alternatives.
- The app still works (search, filters, compare, shop details, routes) when the LLM is unavailable.
- Real dataset imported with a data-quality report; demo scenario and reset work; `README.md`, `DEPLOY.md`, `DEMO_SCRIPT.md`, `PROGRESS.md`, `DECISIONS.md` are up to date.
