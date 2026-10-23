# Design tokens

The visual language follows Torob's light mobile web (observed on torob.com in
October 2026) without copying its markup, assets, logo, or copy. All runtime
values live in `src/app/globals.css` under `@theme`; this file records the
intent and the mapping so the whole look can be adjusted in one place.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| `--color-brand-50` | `#fff1f2` | soft brand backgrounds |
| `--color-brand-100` | `#ffe4e6` | selected/subtle brand fills |
| `--color-brand-200` | `#fecdd3` | brand borders |
| `--color-brand-300` | `#fda4af` | focus rings/disabled brand |
| `--color-brand-500` | `#c81e27` | primary actions, active tabs |
| `--color-brand-600` | `#ae1f27` | brand text/icons |
| `--color-brand-700` | `#8f1920` | brand text on light fills |
| `--color-page` | `#f1f5f9` | app background |
| `--color-surface` | `#ffffff` | cards, sheets, inputs |
| `--color-ink` | `#1e293b` | primary text |
| `--color-muted` | `#64748b` | secondary text |
| `--color-line` | `#e2e8f0` | borders/dividers |
| `--color-success` | `#15803d` | confirmed/available |
| `--color-warning` | `#b45309` | stale price, approximate address |
| `--color-danger` | `#b91c1c` | errors/out of stock |
| `--color-accent` | `#a8ef77` | reserved Torob-style promo accent |
| `--color-accent-ink` | `#0f3d01` | text on the promo accent |

The app is intentionally light-only. `color-scheme: light` is set on the body so
forms and scrollbars do not flip to a dark palette.

## Typography

- Family: self-hosted Vazirmatn variable font (`/fonts/Vazirmatn-Variable.woff2`).
  No CDN is used at runtime. Torob uses IranYekan; Vazirmatn is the brief's
  required replacement and keeps the same geometric, friendly feel.
- Base body size: `14px`, line-height `1.75` for Persian copy.
- Scale in use: 11 / 12 / 13 / 14 / 16 / 18 / 22 / 24+ px.
  Product and section titles are `14–16px` bold; prices `14–16px` extrabold;
  metadata `11–13px` muted; only micro-labels use 11px.
- Persian digits are used in the UI. Latin model/brand names keep their casing.

## Shape and depth

| Token | Value | Use |
| --- | --- | --- |
| `--radius-card` | `1rem` (16px) | main cards, sheets, empty states |
| `--radius-field` | `0.75rem` (12px) | inputs, secondary buttons |
| `rounded-full` | pill | chips, badges, search field |
| `--shadow-card` | `0 1px 2px rgb(15 23 42 / .04)` | optional card lift |
| `--shadow-float` | `0 12px 30px -12px rgb(15 23 42 / .28)` | sticky bars only |

Torob's cards are mostly flat white surfaces on a slate background with a 1px
border. We use the same flat-first approach and reserve shadows for the compare
bar and other floating UI.

## Spacing and layout

- Mobile container: `max-width: 32rem` (512px) with `1rem` side padding; the
  primary target is 390px wide.
- Page rhythm: `1rem` between major sections; `0.75rem` inside cards.
- Tap targets: at least 44px for primary actions; icon-only buttons use a
  40–44px square.
- Bottom action bars respect `env(safe-area-inset-bottom)`.

## Components

- **Search field:** 48–56px tall, white/slate surface, pill or 12px radius,
  search icon on the text side, primary action button.
- **Product card:** white card, 16px radius, image/placeholder, 16px title,
  18px extrabold price in ink, shop count and transparency labels in 11–12px.
  Red is reserved for actions and brand badges, not price text.
- **Shop card:** name + open badge on one row, structured address in two lines,
  price/date grid, stock and feature chips, route/detail links.
- **Buttons:** primary red filled (`brand-500`), secondary white with a border,
  destructive red outline; labels are sentence-case Persian, bold but not
  oversized.
- **Badges:** pill, 1px border or 10% tinted fill, 11–12px.
- **Icons:** 16–20px outline icons with 1.8 stroke, rounded joins. No brand
  icons or copied Torob assets.
- **Empty/error/loading:** shared `PageStatus`/`RouteError` cards across routes,
  friendly Persian copy, a clear next action, and skeletons with the same card
  radius and surface palette. Route-level `error.tsx`, `loading.tsx`, and a root
  `not-found.tsx` cover every defined route.

## Microcopy

Short, calm, and specific. Prefer «قیمت ثبت‌شده»، «موجودی تأییدشده»،
«آدرس تقریبی»، «از فروشنده بپرس»، «مسیریابی» and «جزئیات فروشگاه». Avoid
developer language in buyer-facing surfaces (the internal phase number moved out
of the header and is now exposed only by `/api/health`).
