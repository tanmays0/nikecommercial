# REBRAND AUDIT — Nike / Velocity Athletics → ARCHIVE

Phase 0 find/replace map. Produced before any code changes, per directive.
Two legacy brand identities exist in the codebase and both map to the new **site**
brand **ARCHIVE**:

- **"Nike"** — used in page titles, meta descriptions, the swoosh logo mark, the
  landing page copy/footer, and product/model naming.
- **"Velocity Athletics" / "Velocity"** — the fictional in-build store brand used in
  the design-system headers, global shell (logo aria-label, copyright), site-config
  content pages, store names, and product IDs/names in the generated catalog.

> Note: after the catalogue transformation, real brand names (Nike, Adidas, Jordan,
> etc.) become **legitimate per-product `brand` values** in a multi-brand resale
> marketplace. They are no longer the *site* brand. Only *site-brand* references are
> replaced with ARCHIVE.

Baseline occurrence counts (ripgrep, excluding `node_modules`/`.git`):
`Nike` = 261 matches / 39 files · `Velocity` = 2696 matches / 89 files
(the Velocity count is dominated by `js/products-catalog.generated.js`, which is
rebuilt from `scripts/generate-catalog.js`).

---

## 1. Project / package / build

| Location | Reference | Action |
|---|---|---|
| `package.json` `name` | `nikecommercial` | → `archive-marketplace` |
| Folder name `nikecommercial/` | old brand | Left as-is (repo path; not user-visible, changing risks tooling paths — noted in CHANGELOG) |
| `AUDIT.md` | prior Nike audit notes | Historical doc; left as-is (superseded by this file) |
| `sitemap.xml`, `scripts/generate-sitemap.js` | brand strings/URLs | Regenerate / update host + names |

## 2. Global design system (shared, sitewide)

| File | Reference | Action |
|---|---|---|
| `css/design-system/tokens.css` | `Velocity Design System` header; Antonio/DM Sans fonts; orange `--accent-primary:#ff5500` palette | Rename header comment; swap fonts to **Fraunces** + **General Sans**; remap color tokens to ARCHIVE palette (bone/ink/stone/clay/olive/denim) |
| `css/design-system/*.css`, `css/styles.css` | `Velocity Design System` comment headers | Rename comment headers to ARCHIVE |
| per-page `<link>` fonts (all HTML) | `Antonio` + `Archivo Narrow` | Swap to Fraunces + General Sans |
| `theme-color` meta (all HTML) | `#0b0b0b` | → `#181510` (ink) |

## 3. Global shell (header/footer, all inner pages)

| File | Reference | Action |
|---|---|---|
| `js/site-shell.js` | swoosh `<svg>` logo; `aria-label="Velocity Home"`; footer `© 2026 Velocity Athletics…` | Replace swoosh with **ARCHIVE wordmark SVG**; aria-label → ARCHIVE; new copyright + **independent-marketplace disclaimer** |
| `js/site-config.js` | header comment `Nike Commercial`; collections copy ("Swoosh energy", "visible Air"); `Velocity House` store names; `About Velocity Athletics` + all content pages; `@velocityathletics.com` emails | Rewrite in ARCHIVE curated-resale voice; stores → "ARCHIVE" showrooms; emails → `@archive.market` |

## 4. Home / landing (`index.html`)

| Reference | Action |
|---|---|
| `<title>Nike Air Max Pulse` + meta description | ARCHIVE title + resale meta |
| Header swoosh logo + `aria-label="Nike Home"` | ARCHIVE wordmark |
| Hero overlay text `First Look / Air Max Pulse / Raw speed. Pure Air.` (in-scene brand text) | Swap to ARCHIVE brand mark/copy — **mechanics untouched** |
| Section copy `NIKE AIR MAX PULSE`, "Nike Air Max…", "Step into what feels good" | Rewrite in ARCHIVE editorial voice |
| Footer `About Nike`, `© 2026 Nike, Inc.` | ARCHIVE footer + disclaimer |
| Hardcoded carousel product ids `nike-air-max-*` | Resolve via legacy aliases (kept) — still valid |

## 5. Per-page `<head>` (≈55 HTML files)

All inner pages share the same head pattern:
`<title>… — Nike` / `… — Velocity Athletics`, `meta description`, favicon `data:,`,
fonts link, `theme-color`. Rebranded in bulk via script:
titles/meta → ARCHIVE, fonts swap, favicon links added, theme-color → ink.

## 6. Favicon / icons

| Reference | Action |
|---|---|
| `<link rel="icon" href="data:,">` (all pages) | Add real ARCHIVE favicon (`favicon.svg`) + `apple-touch-icon` derived from companion mark |
| Swoosh glyphs (logo only) | Replaced with ARCHIVE wordmark/mark; other UI icons (cart/search/etc.) are generic — left untouched |

## 7. Product data / catalogue (`scripts/generate-catalog.js` → `js/products-catalog.generated.js`)

| Reference | Action |
|---|---|
| Product IDs `velocity-*` | → `archive-*` (and `js/site-config.js` collection `productIds`) |
| Product names `Velocity <model>` | → `<brand> <model>` (real brand prefix) |
| SKU prefix `VA-` | → `AR-` |
| Descriptions = generic Nike-style retail copy | Rewrite in **editorial curated-resale voice** (condition/era/story-forward) |
| No `brand`/`condition`/`era`/`authenticated` fields | **Add** all four; brand across Nike, Adidas, New Balance, ASICS, Converse, Carhartt, Levi's, The North Face, Patagonia, Stüssy, Supreme, Ralph Lauren, Dickies, Champion, Puma, Reebok, Jordan |
| Multi-size in-stock runs | **Single-unit** availability (one size, one piece) — least-invasive, schema preserved |
| Curated local images (24) + legacy aliases + index carousel | **Preserved** (pinned Nike models keep their real brand + curated imagery) |
| `js/product-card.js`, `js/product-detail-render.js` | Surface `brand`, `authenticated` badge, `condition`, `era` |
| `js/product-schema.js` JSDoc `Velocity Athletics` header | Rename; new fields pass through `normalizeProduct` spread |

## 8. Legal / trust copy (via `site-config.js` CONTENT_PAGES + `support.html`)

About, FAQ, Shipping, Returns, Terms, Privacy, Sustainability, Careers, Accessibility,
Size Guide — rewritten for a **curated resale marketplace** (authentication process,
condition guarantee, resale return policy) with the independent-marketplace disclaimer.

## 9. Preserved (must NOT change)

- Tiger/cheetah scrollytelling hero **mechanics** (`js/tiger-experience.js`,
  `js/animations.js`, timeline/triggers/asset choreography) — only in-scene brand text swapped.
- All ecommerce logic: cart, wishlist, search, filters, checkout, auth, persistence.
- Layout, spacing, grid, component structure, responsiveness, GSAP/Lenis motion.
- Token *structure* (only values swapped).

---

## 10. Completion status (2026-07-05)

| Definition-of-done item | Status |
|---|---|
| Zero site-brand references (Nike/Velocity as storefront) | ✅ `verify-rebrand.js` PASS |
| ARCHIVE logo, favicon, typography, color tokens | ✅ Applied sitewide |
| Hero mechanics unchanged; in-scene brand swapped | ✅ |
| Ecommerce (cart, wishlist, checkout, auth, filters) | ✅ Unchanged logic; listing counts verified |
| Product `brand`, `condition`, `era`, `authenticated` | ✅ 100/100 products |
| Independent-marketplace disclaimer | ✅ Footer (index + site-shell) |
| Layout/structure preserved | ✅ Rebrand-only diff |
