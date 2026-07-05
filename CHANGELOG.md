# CHANGELOG — ARCHIVE Rebrand & Catalogue Transformation

Rebrand of the Nike / "Velocity Athletics" concept storefront into **ARCHIVE**, a
curated multi-brand vintage/resale marketplace. Rebrand + content transformation only —
no redesign, no architecture/animation/ecommerce-logic changes.

## Brand identity
- New ARCHIVE SVG wordmark + companion mark (garment-tag monogram); favicon + apple-touch-icon derived from the mark.
- Typography swapped to **Fraunces** (display) + **General Sans** (UI, Inter fallback) — token values only, type scale unchanged.
- Color tokens remapped to the warm-neutral ARCHIVE palette (bone / ink / stone / clay / olive / denim). Token *structure* unchanged.

## Sitewide
- Titles, meta descriptions, OG, theme-color, favicon links rebranded across all HTML pages.
- Global shell logo, nav aria-labels, footer copyright, and independent-marketplace disclaimer updated.
- Marketing + legal/trust copy rewritten in ARCHIVE curated-resale voice.

## Catalogue
- Added `brand`, `condition`, `era`, `authenticated` fields to every product.
- Product names/IDs/SKUs and descriptions rewritten (editorial, condition/story-forward).
- Single-unit availability reflected (one size, one piece) — least-invasive; cart/checkout schema preserved.
- Curated local imagery, min-3-images, and no-duplicate-image guarantees preserved.

## Tradeoffs / notes
- **Repo folder name** (`nikecommercial/`) left unchanged: renaming the working directory
  risks breaking local tooling/paths and is not user-visible. Site brand is fully ARCHIVE.
- **Pinned Nike models** (Air Max family, Dunk, Pegasus, etc. — the 24 products with curated
  local photography and the 6 hero-carousel items) keep `brand: "Nike"`/`"Jordan"` (their real
  brands) so curated imagery, legacy id aliases, and the untouched hero carousel keep working.
  This is truthful for a resale marketplace (Nike is the dominant resale brand) and avoids
  regressing prior image work.
- **Single-unit inventory** implemented via a one-size listing rather than a stock-decrement
  data-model rewrite, per the directive's least-invasive guidance (cart/checkout unchanged).
- Historical `AUDIT.md` from the prior Nike build is superseded by `REBRAND-AUDIT.md` and left in place.

## Verification (2026-07-05)
- `node scripts/verify-rebrand.js` — **PASS** (zero legacy site-brand matches in user-facing files).
- Catalogue: 100 products · 17 resale brands · 100/100 `authenticated` + `condition` · 37 with `era` · 22 legacy id aliases for hero carousel.
- Listing pages populate (diagnose-catalog: Men 41, Women 29, etc.) · zero cross-product image duplicates.
- Hero scrollytelling mechanics untouched (`js/tiger-experience.js`, `js/animations.js`); in-scene copy swapped to ARCHIVE.
