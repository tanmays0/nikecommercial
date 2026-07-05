# NIKECOMMERCIAL — Phase 0 Codebase Audit

_Audit date: 2026-07-04 · Branch: `master` · Commits on record: 2 · Working tree: clean · Tracked files: 302_

This document is the mandatory Phase 0 deliverable. It reflects the repository **as it actually exists on disk**, not assumptions. No source code was modified to produce it.

---

## 1. Stack Fingerprint

| Aspect | Finding |
|---|---|
| **Type** | Static multi-page website (MPA). No SPA framework. |
| **Framework** | **None.** Pure vanilla HTML5 + CSS + ES5/ES6 JavaScript (IIFE modules, one `class`). |
| **Router** | File-based / native browser navigation. Each page is a physical `.html` file. Client state passed via URL query params (`?id=`, `?category=`). |
| **Styling** | **Single hand-authored stylesheet**: `css/styles.css` (~2,645 lines). Uses native CSS custom properties as design tokens. No Sass/Less/PostCSS/Tailwind/CSS-Modules. |
| **State** | No library. Global singletons on `window`: `window.ProductsData` (catalog), `window.CartEngine` (cart). Cross-component sync via a custom DOM event `nikeCartUpdated`. Persistence via `localStorage` key `nikecommercial_cart`. |
| **Animation** | **GSAP 3.12.5** + **ScrollTrigger** + **Lenis 1.1.18**, all via jsDelivr CDN `<script>` tags. |
| **Fonts** | Google Fonts: `Antonio` (headings) + `Archivo Narrow` (body), `<link>` loaded. |
| **Build tool** | **None.** No bundler, transpiler, or minifier. Files are served as authored. |
| **Package manager** | npm (`package-lock.json` present). Single devDependency: `serve@^14.2.4`. |
| **Dev server** | ⚠️ **Two conflicting definitions.** `package.json` → `serve -l 55333`. `start.ps1` → `python -m http.server 55333`. Both target port 55333 but use different runtimes. |
| **Deployment target** | Not configured. No CI, no host config, no `vercel.json`/`netlify.toml`. Deployable as pure static assets to any static host. |
| **Platform** | Windows dev environment (PowerShell; note `&&` chaining is unsupported by the installed PowerShell version). |

---

## 2. Architecture Map

### Folder structure
```
nikecommercial/
├── index.html                # Tiger scrollytelling landing (signature experience)
├── shop.html                 # Legacy "all products" shop  (→ shop-render.js)
├── shop-men.html             # Category page              (→ shop-renderer.js)
├── shop-women.html           # Category page              (→ shop-renderer.js)
├── shop-kids.html            # Category page              (→ shop-renderer.js)
├── shop-accessories.html     # Category page              (→ shop-renderer.js)
├── product.html              # Legacy PDP                 (→ product-render.js)
├── product-detail.html       # New split-screen PDP       (→ product-detail-render.js)
├── cart.html                 # Full bag page              (→ cart-page.js)
├── support.html              # Help / FAQ center
├── css/
│   └── styles.css            # Entire design system + all page styles
├── js/
│   ├── products-data.js      # 24-product catalog → window.ProductsData
│   ├── cart-engine.js        # localStorage cart → window.CartEngine + nikeCartUpdated
│   ├── cart-ui.js            # Header badge counter + "added" toast
│   ├── cart-drawer.js        # Global sliding cart drawer (injected at runtime)
│   ├── cart-page.js          # Renders cart.html line items
│   ├── shop-render.js        # Renders legacy shop.html grid + category tabs
│   ├── shop-renderer.js      # Renders shop-*.html category grids + sidebar filters
│   ├── product-render.js     # Hydrates legacy product.html
│   ├── product-detail-render.js  # Hydrates product-detail.html + 404 state
│   ├── pages.js              # Sub-page Lenis, mobile menu, accordions, hovers
│   ├── main.js               # index.html: Lenis, GSAP wiring, carousel, tiger init
│   ├── animations.js         # `Motion` reveal-helper toolkit (shared tokens)
│   └── tiger-experience.js   # Dual-canvas frame-scrubbing hero engine
├── assets/
│   ├── images/               # 7 curated hero/carousel JPGs
│   ├── products/             # 24 product JPGs (one per SKU), ~2.4 MB
│   └── frames/               # ⚠️ Only 1 file — near-empty fallback path
├── tigerimages/              # 242 sequential JPG frames, 34.6 MB (hero source)
├── package.json / package-lock.json
├── start.ps1                 # Alt dev-server launcher (Python)
└── .gitignore
```

### Routing / page inventory (10 pages)
| Page | Purpose | Renderer | Status |
|---|---|---|---|
| `index.html` | Hero + editorial landing | `main.js` + `tiger-experience.js` + `animations.js` | Working |
| `shop.html` | All products, category tabs | `shop-render.js` | Working (**legacy, overlaps category pages**) |
| `shop-men/women/kids/accessories.html` | Per-category grids + filters | `shop-renderer.js` | Working |
| `product.html` | Product detail | `product-render.js` | Working (**legacy, superseded by product-detail.html**) |
| `product-detail.html` | Split-screen PDP + 404 | `product-detail-render.js` | Working |
| `cart.html` | Full bag page | `cart-page.js` | Working |
| `support.html` | Help center | `pages.js` (accordions) | Working |

### Component reuse pattern
There is **no component system** — the header (`.site-header`) and footer (`.site-footer`) markup is **copy-pasted into all 10 HTML files**. Any header/footer change today requires editing 10 files. This is the single biggest structural maintainability issue.

### Global contracts (the de-facto "API")
- `window.ProductsData` → `{ PRODUCTS, CATEGORIES, SUBCATEGORIES, getProductById, getProductsByCategory, getProductsBySubcategory, searchProducts }` (frozen).
- `window.CartEngine` → `{ EVENT_NAME, STORAGE_KEY, getCart, getCartCount, getCartTotal, addToCart, removeFromCart, updateQuantity, clearCart }` (frozen).
- `window.showCartToast(name)` — from `cart-ui.js`.
- `window.openCartDrawer()` / `window.closeCartDrawer()` — from `cart-drawer.js`.
- `window.initShopCardHovers()` — from `pages.js`.
- Event: `nikeCartUpdated` with `detail = { cart, count, total }`.

---

## 3. Styling Audit

### Token system (`:root` in `css/styles.css`)
Reasonably mature for a hand-built site:
- **Color:** `--color-white #fff`, `--color-black #111`, `--color-carbon #0b0b0b`, `--color-muted #6e6e6e`, `--color-border #e8e8e8`, `--color-border-soft #f0f0f0`.
- **Type:** `--font-heading` (Antonio), `--font-body` (Archivo Narrow); fluid scale `--title-size`, `--title-size-sm`, `--body-size`, `--meta-size` via `clamp()`; tracking/leading tokens.
- **Layout:** `--header-height 60px`, `--container-max 1200px`, `--section-pad`, `--section-gap`.
- **Motion:** `--ease-out`, `--ease-in-out`, `--ease-premium`, `--transition-base/fast/slow`.

### Issues found
1. **`--color-accent` is `#ffffff`** — an "accent" identical to white is functionally a non-token. The brand has **no true accent color**, which caps how premium/branded the UI can feel.
2. **`--color-off-white` is undefined** but referenced (e.g. cart drawer/item media backgrounds `var(--color-off-white, #f5f5f5)`). It silently falls back — works, but is an implicit hardcode and a missing token.
3. **Hardcoded values scattered** — many `rgba(11,11,11,…)`, `rgba(0,0,0,…)`, and one-off px radii/shadows that should be tokens (shadow scale, radius scale, overlay-scrim token).
4. **No radius or elevation scale** — border-radius values (`2px`/`3px`/`100px`/`999px`) and box-shadows are ad hoc.
5. **Single monolithic stylesheet** (~2,645 lines) — no logical file split; navigation relies on section comment banners.
6. **Breakpoints are consistent** (`768`, `1024`, `1200`, plus `640`) but defined as raw literals repeated ~24 times rather than documented tiers.
7. Good: reduced-motion, `hover:hover` guards, focus-visible theming, and `::selection` are all present.

---

## 4. JavaScript Audit

### Patterns
- Every module is an **IIFE** that guards on its dependencies (`if (!window.ProductsData) return;`) and reads/writes the DOM directly. No imports/exports, no modules, no bundler.
- Data fetching: **none/synchronous** — the catalog is a hardcoded array in `products-data.js`. Images are remote (Unsplash/local mix).
- Cart is the only real "store": `cart-engine.js` owns an in-memory array mirrored to `localStorage`, dispatches `nikeCartUpdated`, and validates size/color against catalog data.

### Duplication / redundancy (highest-value cleanup targets)
1. **Two shop systems:** `shop.html`+`shop-render.js` (tabs) vs `shop-*.html`+`shop-renderer.js` (sidebar filters). Overlapping responsibility; `shop-render.js` is the older approach.
2. **Two PDP systems:** `product.html`+`product-render.js` vs `product-detail.html`+`product-detail-render.js`. The new split-screen PDP supersedes the legacy one, but both are shipped and linked in places.
3. **Lenis + mobile-menu + anchor logic is implemented twice** — once in `main.js` (index) and once in `pages.js` (sub-pages). Divergence risk.

### Correctness notes
- `cart-engine.js` normalizes sizes to **strings** consistently (good; earlier number/string mismatch is resolved). Colors validated case-insensitively.
- `cart-engine.js` dispatches an update on load so the badge/drawer hydrate on every page. Good.
- Link targets are **inconsistent across pages**: some product links point to `product.html`, others to `product-detail.html` (renderers were migrated to `product-detail.html`, but static markup in a few files still references the legacy PDP). Needs a single canonical PDP.
- No global error boundary/telemetry (acceptable for a static concept site).

---

## 5. Animation Audit — Tiger / Cheetah Scrollytelling Hero ⭐ (signature, protected)

### Libraries & wiring
- **GSAP ticker** drives the render loop; **ScrollTrigger** maps scroll progress → frame progress; **Lenis** provides smooth scroll and is bridged into ScrollTrigger via `scrollerProxy(document.body, …)` in `main.js`.
- Engine lives in `js/tiger-experience.js` as `class TigerExperience`.

### Asset choreography
- **242 sequential JPGs**, `tigerimages/ezgif-frame-001.jpg … 242.jpg`, **34.6 MB total** (~143 KB/frame average).
- Fallback path array: `['tigerimages/ezgif-frame-', 'assets/frames/ezgif-frame-']`. `assets/frames/` currently holds **only 1 file**, so it is not a real second source — effectively a dead fallback.
- `index.html` preloads frame 001 with `<link rel="preload" as="image" fetchpriority="high">`.

### Timeline / trigger structure
- Hero is `height: 800vh` with a `position: sticky` inner stage (`.hero__sticky`) pinned for the scroll duration.
- **Dual canvas:** `#tiger-canvas` (foreground, `z-index:2`) + `#ambient-canvas` (background wash, blurred `filter: blur(56px)`, `mix-blend-mode: soft-light`, `opacity .14`).
- ScrollTrigger `start: 'top top'`, `end: 'bottom bottom'`, `scrub: 0.55`. `onUpdate` writes `targetProgress`; the ticker eases `displayProgress` toward it (`+= delta * 0.22`) for buttery interpolation.
- **Fractional crossfade** between adjacent frames (`_paintCrossfade`) with a `BLEND_EPSILON` redraw threshold to skip redundant paints. `object-fit: cover` math cached per canvas size.

### Loading strategy (already optimized in prior work)
- **Progressive, non-blocking:** bootstraps the first ~30 frames, then renders and attaches immediately.
- **Playhead-priority preload:** loads frames ahead of (55) and behind (12) the current scroll position; continues during scroll at a reduced batch size (3 active / 6 idle) using `requestIdleCallback`.
- **Urgent fetch:** if the next needed frame isn't ready during render, it's requested immediately; nearest loaded frame is shown as a fallback (`_getLoadedFrame`) so it never goes black.
- Ambient (second) canvas is only painted **after** full preload completes, halving paint cost during load.

### Performance profile
- DPR capped (1.25 mobile / 1.75 desktop) to limit fill-rate.
- Main remaining cost: **decoding 34.6 MB of JPGs**. Frames are **not** in modern formats (WebP/AVIF) and not resolution-tiered — this is the top hero-perf lever left, and it is **purely additive/safe** (swap source format, keep timeline).
- Earlier reported jank (first 10–15 s, mid-scroll freeze) was addressed by the progressive+playhead loader; steady-state scrubbing is smooth.

### Accessibility
- `prefers-reduced-motion`: `scrub` is disabled and `displayProgress` snaps to `targetProgress` (no eased interpolation). Canvases are `aria-hidden`. There is **no static poster fallback** offered to reduced-motion users (opportunity, additive).

### Verdict
The hero is **healthy, well-optimized, and must be preserved**. All further work should be **additive**: modern-format frames, optional reduced-motion poster, and easing polish — never a structural rewrite.

---

## 6. Asset Audit

| Set | Location | Count | Size | Format | Notes |
|---|---|---|---|---|---|
| Hero frames | `tigerimages/` | 242 | 34.6 MB | JPG | Not WebP/AVIF; single resolution; largest payload on site. |
| Curated hero/carousel | `assets/images/` | 7 | — | JPG | Used by index carousel/essentials. |
| Product photos | `assets/products/` | 24 | 2.4 MB | JPG | One primary per SKU; unique per product. |
| Frame fallback | `assets/frames/` | 1 | — | — | Effectively empty; dead fallback path. |
| Remote images | catalog gallery slots | — | — | Unsplash URLs | Secondary/tertiary product gallery images pull from Unsplash at runtime → external dependency + no control over uptime/optimization. |

### Issues
1. **No modern formats** anywhere (no WebP/AVIF `<picture>` sources).
2. **No responsive variants** (`srcset`/`sizes`) — desktop-weight images shipped to mobile.
3. **Mixed local + remote** product imagery — gallery relies on live Unsplash URLs (fragile, unoptimized, and a brand/legal consideration per the directive).
4. `assets/frames/` should either be populated as a genuine fallback or removed from the path list.
5. No favicon asset (`<link rel="icon" href="data:,">` placeholder on every page).

---

## 7. Weakness List (ranked — blocking a premium ecommerce experience)

1. **Duplicated page shells (no header/footer partial).** Header + footer copy-pasted across 10 files → change-amplification and drift (nav links already differ per page). Highest structural risk to consistency.
2. **34.6 MB of unoptimized JPG hero frames + no modern image formats sitewide.** Dominant Core Web Vitals / bandwidth cost. (Fix is additive & hero-safe.)
3. **Two competing PDPs and two competing shop systems.** `product.html`/`product-detail.html` and `shop.html`/`shop-*.html` overlap; internal links are inconsistent. Needs one canonical PDP + one shop model.
4. **SEO is near-absent.** No Open Graph, Twitter cards, canonical URLs, JSON-LD (`Product`/`BreadcrumbList`/`Organization`), `sitemap.xml`, or `robots.txt`. Only a single generic `<meta description>` and `theme-color`.
5. **Design-token gaps.** `--color-accent` is white (no real brand accent), `--color-off-white` undefined, no radius/elevation/scrim scales, scattered hardcoded rgba/shadows.
6. **Remote (Unsplash) product gallery images.** External runtime dependency, unoptimized, and a licensing/brand-hygiene concern for public deployment.
7. **No true checkout flow.** Cart + drawer + bag page exist, but "Checkout"/"View Full Bag" CTAs do not lead to a checkout experience.
8. **Accessibility polish gaps.** No reduced-motion poster for the hero; `--color-muted #6e6e6e` on white sits near the AA floor (~4.6:1) and should be verified everywhere it's used for text; drawer focus-trap is minimal (Escape + initial focus only, no full trap cycle).
9. **Dev-server inconsistency.** `serve` (npm) vs `python http.server` (start.ps1) — two runtimes, confusing onboarding.
10. **Dead/placeholder bits.** `assets/frames/` fallback, `data:,` favicon, a few footer links pointing to `index.html`/`#`.

---

## 8. Risk List (touch carefully)

| # | Item | Why it's fragile | Handling rule |
|---|---|---|---|
| 🔴 1 | **Tiger hero (`tiger-experience.js`, `#hero`, `main.js` ScrollTrigger/Lenis bridge)** | Signature experience; dual-canvas timing, playhead loader, and `scrollerProxy` bridge are interdependent. A wrong edit black-screens the hero or kills scroll. | **Additive changes only.** Keep 800vh trigger, `scrub`, dual-canvas, and progressive loader. Any change (formats, poster, easing) must preserve the timeline and be tested through the full scroll. |
| 🔴 2 | **Lenis ↔ ScrollTrigger integration** | Implemented separately in `main.js` (index) and `pages.js` (sub-pages). Changing scroll wiring in one place can desync the other; `scrollerProxy` on `document.body` is easy to break. | Refactor only behind a shared module with identical behavior; verify pinning + anchor scroll on every page. |
| 🟠 3 | **`window.CartEngine` / `nikeCartUpdated` contract** | Consumed by cart-ui, cart-drawer, cart-page across all pages. Signature changes ripple everywhere. | Preserve method signatures and event `detail` shape; extend, don't break. |
| 🟠 4 | **`window.ProductsData` shape** | Renderers depend on exact fields (`images[]`, `sizes[]`, `colors[]`, `category`, `subcategory`). | Additive fields only; keep existing keys. |
| 🟠 5 | **Copy-pasted header/footer** | Consolidating into a partial/injector must update 10 files identically or nav breaks per-page. | Introduce one source of truth carefully; diff every page after. |
| 🟡 6 | **Product links split between two PDPs** | Consolidating to one PDP risks dead `?id=` links if the other file is removed without redirects. | Pick canonical PDP; update all links + keep a redirect/alias before deleting. |
| 🟡 7 | **`serve` SPA-style rewrites** | `serve` may rewrite unknown routes; static `.html` links must resolve exactly. | Keep explicit `.html` links; verify no route rewriting masks 404s. |

---

## Assumptions logged (for `CHANGELOG.md`)
- Treat this as a **fictional athletic brand** skinned in a Nike-grade visual language (per directive §1 brand hygiene). Original copy + licensed/original imagery going forward.
- **Canonical PDP** will be `product-detail.html`; the legacy `product.html` is a consolidation candidate (not deleted without link migration).
- **Canonical shop model** will be the category pages + a unified all-products view; `shop.html`/`shop-render.js` is a consolidation candidate.
- Dev server of record is **`npm start` (`serve`) on port 55333**; `start.ps1` is secondary.

---

_End of Phase 0 audit. No application code was modified. Awaiting go-ahead for Phase 1._

---

# Phase 1 — Information Architecture (Complete)

_Phase 1 delivery date: 2026-07-04 · Implements full sitemap with unified navigation shell_

## Sitemap

| Section | Pages | Route(s) | Primary nav path |
|---|---|---|---|
| **Storefront** | Home | `index.html` | Logo, all pages → Home |
| | Shop (all) | `shop.html` | Mega menu → Shop → All Products; footer Shop |
| | New Arrivals | `new-arrivals.html` | Header primary; mega Shop |
| | Best Sellers | `best-sellers.html` | Mega Shop |
| | Trending | `trending.html` | Mega Shop; footer Shop |
| | Sale | `sale.html` | Header primary; mega Shop; footer |
| | Featured | `featured.html` | Mega Shop; home `#featured` anchor |
| **Categories** | Men | `shop-men.html` | Header primary; mega Categories |
| | Women | `shop-women.html` | Header primary; mega Categories |
| | Kids | `shop-kids.html` | Header primary; mega Categories |
| | Accessories | `shop-accessories.html` | Mega Categories |
| **Sport Lines** | Running, Training, Basketball, Lifestyle, Jordan, Air Max | `running.html` … `air-max.html` | Mega Sport Lines |
| **Collections** | Index + 4 editorial landings | `collections.html`, `collection.html?slug=` | Mega Collections; footer Collections |
| **Product** | PDP | `product-detail.html?id=` | Shop cards, search, wishlist |
| | Quick View | modal on shop/catalog cards | Quick View button on hover |
| | Size Guide | `size-guide.html` | PDP contextual link |
| | Recently Viewed | `recently-viewed.html` | PDP link; mega Discover |
| | Recommended | `#product-recommended` on PDP | Contextual on PDP |
| | Compare | `compare.html?ids=` | PDP link; mega Discover |
| **Discovery** | Search | `search.html` | Header search icon |
| | Store Locator | `store-locator.html` | Mega Discover; footer Company |
| **Cart & Checkout** | Cart page | `cart.html` | Header bag icon |
| | Cart drawer | injected overlay | Bag icon; add-to-bag |
| | Checkout | `checkout.html` | Cart → Checkout; drawer Checkout |
| | Mock payment | checkout step 2 | Checkout flow |
| | Order confirmation | `order-confirmation.html` | Post-checkout redirect |
| **Orders** | Order tracking | `order-tracking.html` | Footer Help; mega/footer links |
| | Order history | `orders.html` | Account mega; profile nav |
| | Order detail | `order-detail.html?id=` | Orders list |
| **Account** | Login, Register, Forgot/Reset password | `login.html` … | Header account icon |
| | Profile, Addresses, Payment Methods, Notifications, Settings | respective `.html` | Profile hub nav |
| | Wishlist | `wishlist.html` | Mega Account; profile nav; footer |
| **Content / Trust** | About, Contact, FAQs, Support, Shipping, Returns, Privacy, Terms, Gift Cards, Sustainability | content pages | Footer Help / Company / legal row |
| **System** | 404 | `404.html` | Linked from PDP not-found pattern |
| | Empty cart | `#cart-empty` on `cart.html` | Cart page state |
| | Empty wishlist | `#wishlist-empty` on `wishlist.html` | Wishlist page state |
| | Empty search | `#search-empty` on `search.html` | Search page state |
| | Generic error | `error.html` | Footer/legal fallback; links to Support |

## Architecture added in Phase 1

| Module | Role |
|---|---|
| `js/site-config.js` | IA registry: NAV, FOOTER, CATALOG_PAGES, CONTENT_PAGES, COLLECTIONS, STORES |
| `js/site-shell.js` | Injects unified header (mega menu + search/account/cart) and 4-column footer |
| `js/catalog-page.js` | Template-driven catalog listings (new arrivals, lines, sale, etc.) |
| `js/content-page.js` | Template-driven legal/info pages |
| `js/search-page.js` | Live/instant product search |
| `js/collection-page.js` | Editorial collection index + slug landings |
| `js/wishlist-engine.js` | localStorage wishlist + recently viewed |
| `js/discovery-page.js` | Wishlist, recently viewed, compare renderers |
| `js/checkout-page.js` | 3-step mock checkout → order confirmation |
| `js/account-page.js` | Mock auth, orders, tracking, store locator |
| `js/quick-view.js` | Quick View modal on shop/catalog cards |

## Additions

Premium flagship pages added beyond the original brief (not listed in Phase 1 spec):

1. **Careers** (`careers.html`) — standard for global retail flagships
2. **Accessibility Statement** (`accessibility.html`) — WCAG commitment + footer legal row
3. **Standalone Size Guide** (`size-guide.html`) — linked from PDP; complements in-page size selector

## Navigation contract

- **Header (inner pages):** Primary nav (New, Men, Women, Kids, Sale) + search + account + bag + hamburger mega menu (Shop, Categories, Sport Lines, Collections, Discover, Account).
- **Header (home):** Preserved in-page anchors for hero sections; footer uses full IA via `site-shell` (`data-shell="home"`).
- **Footer:** Shop, Help, Company, Account columns + Privacy / Terms / Accessibility legal row.
- **No orphan routes:** Every `.html` file is reachable via header mega menu, footer column, or contextual link (PDP, cart flow, account hub).

## Legacy notes

- `product.html` + `shop.html`/`shop-render.js` remain as richer legacy variants; canonical PDP is `product-detail.html`, canonical category shop is `shop-*.html`. Links across the site point to canonical routes.
- Tiger hero on `index.html` was not structurally modified — only footer shell and script includes were added.

_End of Phase 1 IA deliverable._

---

# Phase 2 — Design System (Complete)

_Phase 2 delivery date: 2026-07-04 · Single source of truth before page-level refactors_

## Location

All design tokens and reusable components live under **`css/design-system/`**, imported once at the top of `css/styles.css`:

```
css/design-system/
├── index.css              # Master import
├── tokens.css             # Colors, type, spacing, breakpoints, grid, motion
├── typography.css         # Type scale utilities + editorial classes
├── grid.css               # 12-column grid + layout utilities
├── base.css               # Focus rings, a11y, keyframes
└── components/
    ├── button.css         # .ds-btn (+ legacy .btn aliases)
    ├── form.css           # Input, select, checkbox, radio + validation
    ├── product-card.css   # .ds-product-card (+ .shop-card)
    ├── price.css          # Sale/strikethrough display
    ├── rating.css         # Star rating
    ├── badge.css          # New / Sale / Best Seller tags
    ├── nav.css            # Mega menu + header actions
    ├── footer.css         # Site footer
    ├── modal.css          # Modal + quick view
    ├── drawer.css         # Cart / filter drawer
    ├── toast.css          # Notifications
    ├── skeleton.css       # Loading placeholders
    ├── empty-state.css    # Empty + error states
    ├── pagination.css     # Pagination + load more
    ├── breadcrumb.css
    ├── tabs.css           # PDP description/specs/reviews pattern
    ├── accordion.css      # FAQ + filters
    ├── carousel.css       # Product gallery + recommendations
    └── patterns.css       # Checkout, account, content page layouts
```

## Typography

| Role | Face | Token |
|---|---|---|
| Display / headlines | **Antonio** | `--font-display` |
| UI / body | **DM Sans** (grotesk sans) | `--font-ui` |

**Modular scale:** `--text-xs` (12px) through `--text-4xl` (96px), each with explicit `--leading-*` and `--tracking-*`. Fluid display sizes via `--type-display-fluid` / `--type-headline-fluid`.

**Performance:** Fonts loaded via `@import` in `tokens.css` with `display=swap`. Preload snippet for pages (when migrated):

```html
<link rel="preload" href="..." as="style">
<link href="https://fonts.googleapis.com/css2?family=Antonio:wght@700&family=DM+Sans:..." rel="stylesheet">
```

## Color tokens

| Category | Examples |
|---|---|
| Base | `--surface-primary` (#fff), `--surface-secondary` (#fafafa), `--text-primary` (#111), `--neutral-950` (#0a0a0a) |
| Accent | `--accent-primary` (#ff5500) with hover/active variants |
| Semantic | `--color-success`, `--color-error`, `--color-warning`, `--color-sale` (+ surface tints) |
| Neutrals | `--neutral-0` … `--neutral-950` for borders, dividers, disabled |
| Legacy aliases | `--color-black`, `--color-border`, etc. map to canonical tokens |

**Rule:** New component CSS uses tokens only — no raw hex in components.

## Spacing

4px base rhythm: `--space-1` (4px) through `--space-12` (64px). Layout utilities: `.stack`, `.cluster`, grid gutters per breakpoint.

## Grid & breakpoints

| Token | Width |
|---|---|
| `--bp-mobile` | 375px |
| `--bp-tablet` | 768px |
| `--bp-laptop` | 1024px |
| `--bp-desktop` | 1440px |
| `--bp-wide` | 1920px |

12-column `.ds-grid` with responsive gutters (`--gutter-mobile` … `--gutter-wide`).

## Component inventory

All interactive components implement: **default, hover, focus-visible, active, disabled, loading, error, empty** where applicable.

| Component | Canonical class | Legacy alias |
|---|---|---|
| Button primary/secondary/ghost/icon/accent | `.ds-btn--*` | `.btn`, `.btn--pill`, `.btn--outline` |
| Form controls | `.ds-input`, `.ds-checkbox`, `.ds-radio` | `.form-field`, shop filters |
| Product card | `.ds-product-card` | `.shop-card` |
| Price | `.ds-price` | `.price-sale`, `.price-was` |
| Rating | `.ds-rating` | — |
| Badge / tag | `.ds-badge--new/sale/bestseller` | — |
| Nav + mega menu | `.site-mega-nav` | — |
| Footer | `.site-footer` | — |
| Modal | `.ds-modal` | `.quick-view` |
| Drawer | `.ds-drawer` | `.cart-drawer` |
| Toast | `.ds-toast` | `.cart-toast` |
| Skeleton | `.ds-skeleton` | — |
| Empty state | `.ds-empty` | `.shop-empty`, `.cart-empty` |
| Pagination / load more | `.ds-pagination`, `.ds-load-more` | — |
| Breadcrumb | `.ds-breadcrumb` | — |
| Tabs | `.ds-tabs` | — |
| Accordion | `.ds-accordion` | `.accordion` |
| Carousel | `.ds-carousel` | hero `.carousel__*` |

## Migration notes

- `css/styles.css` now **imports** the design system; page-specific styles (tiger hero, carousel, PDP layout) remain in `styles.css`.
- HTML pages still link Google Fonts (Archivo Narrow) — remove duplicate font `<link>` during Phase 3 page migration; DM Sans from design system takes precedence.
- Use `.ds-*` classes for new markup; legacy `.btn` / `.shop-card` aliases preserved for zero-breakage.

_End of Phase 2 design system deliverable._

---

# Phase 3 — Product Data Layer

## 5.1 Catalog scope

**100 products** generated in `scripts/generate-catalog.js` → `js/products-catalog.generated.js`.

| Dimension | Distribution |
|---|---|
| Categories | Men, Women, Kids, Accessories (realistic mix) |
| Brand lines | Air Max, Jordan, Running, Training, Basketball, Lifestyle |
| Inventory | in_stock: 73 · low_stock: 13 · backorder: 9 · out_of_stock: 5 |
| On sale | 13 products with `compareAtPrice` |
| New / Best Seller | Tagged via `isNew`, `isBestSeller`, and `tags[]` |

Every inventory badge, sale price, and size-unavailable state is backed by real catalog data.

## 5.2 Product schema

| Module | Role |
|---|---|
| `js/product-schema.js` | JSDoc types, `normalizeProduct()`, helpers (`isOnSale`, `isPurchasable`, `formatPrice`, `INVENTORY_LABEL`) |
| `js/products-catalog.generated.js` | Auto-generated catalog (`window.__PRODUCTS_CATALOG__`) + legacy ID aliases |
| `js/products-data.js` | Public API: `RAW_PRODUCTS`, `getRawProductById`, legacy Proxy view for backward compat |
| `js/product-card.js` | Shared card/price markup for grids and search |
| `js/product-images.js` | `<picture>` renderer with AVIF/WebP srcset, lazy/eager loading |

Full schema fields: id, sku, slug, name, brandLine, category, price, compareAtPrice, currency, description, features, specifications, sizes (with `inStock`), colors (with hex + per-color images), images, rating, reviews, shippingInfo, returnPolicy, related/recommended IDs, tags, isNew, isBestSeller, inventoryStatus, createdAt.

**Legacy URL compat:** `?id=nike-air-max-pulse-01` resolves via `__PRODUCTS_LEGACY_ALIASES__`.

## 5.3 Image rules

- Minimum **3 unique angles** per product (front/side/back/angled/lifestyle/close-up); 4:5 aspect ratio (800×1000)
- Unique image URLs per product (seeded picsum / Unsplash); color variants have dedicated shots
- `ProductImages.renderPicture()` — AVIF + WebP `<source>` + fallback `<img>` with `srcset`/`sizes`
- First PDP image loads **eager** + `fetchpriority="high"`; all others lazy
- Descriptive `alt` on every content image (product name + color + angle)
- Reserved width/height + aspect-ratio CSS — no layout shift

## Script load order (all commerce pages)

```
site-config.js → product-schema.js → products-catalog.generated.js → product-images.js → product-card.js → products-data.js → …
```

Patched across **56 HTML pages** via `node scripts/patch-product-scripts.js`.

## Updated renderers

- `catalog-page.js`, `shop-render.js`, `shop-renderer.js` — `ProductCard.buildShopCard()` + inventory/sale badges
- `product-detail-render.js` — full PDP: gallery, color swatches, size stock, reviews, specs tabs, related products
- `quick-view.js`, `search-page.js`, `collection-page.js`, `discovery-page.js` — schema-aware markup
- `cart-engine.js` — blocks out-of-stock / unavailable sizes; respects `inventoryStatus`

## CSS

- `css/design-system/components/product-picture.css` — picture wrappers, inventory badges, PDP tabs/reviews

## Regenerate catalog

```bash
node scripts/generate-catalog.js
```

_End of Phase 3 product data layer deliverable._

---

# Phase 4 — E-commerce Functionality

Fully working, persisted, realistic flows backed by a mock service layer (simulated
latency + loading/empty/error states). No real backend.

## New engine modules (`js/`)

- `mock-service.js` — `MockService.request()` wraps producers with simulated network
  latency + optional error rate; shared `loadingHtml`/`spinnerHtml`/`errorHtml`/`emptyHtml`
  and `hydrateList()` helpers for consistent loading/empty/error states.
- `pricing.js` — single source of truth for money math: subtotal, free-shipping threshold
  ($75), standard/expedited shipping, 8.25% tax, and `summarize()` for full order totals.
- `coupon-engine.js` — coupon validation with valid / invalid / expired / ineligible states.
  Codes: `VELOCITY10`, `RUN20` (min $100), `FREESHIP`, `SAVE15` (min $60), `EXPIRED5`.
- `auth-engine.js` — mock auth: register/login/forgot/reset + session persistence
  (`velocity_session`), field-level validation, demo account `demo@velocity.com` / `Velocity1`.
- `account-store.js` — per-user addresses, payment methods (masked), notification prefs,
  and settings, namespaced by email.
- `order-engine.js` — order creation, history, detail, 5-step status timeline; seeds 3
  realistic past orders once.
- `reviews-engine.js` — merges catalog reviews with locally-added ones (persisted), computes
  rating distribution; powers the PDP write-a-review form.

## Features

- **Cart** — drawer + full page, qty +/−, per-line + order summary (subtotal/shipping/tax),
  free-shipping progress, localStorage persistence, cross-tab sync via `storage` event.
- **Wishlist** — hover heart on every product card (global delegation), persisted, dedicated
  page with "You might like" suggestions, header count indicator.
- **Search** — debounced live results, popular-search chips, URL `?q=`, empty + loading states.
- **Filtering & sorting** — category/size/color/price/sale/in-stock (AND logic), sort by
  featured/newest/price/rating/best-selling; state reflected in the URL (shareable).
- **Variants & stock** — size/color selection, out-of-stock sizes disabled (not hidden),
  color swap updates gallery, low-stock/backorder/out-of-stock messaging everywhere.
- **Checkout** — multi-step (shipping → payment → review), per-step validation, card
  formatting + brand detection + Luhn check, coupon, live totals, simulated success/decline
  (success card `4242 4242 4242 4242`; odd last digit declines).
- **Orders** — confirmation page with summary, history list, detail with status timeline,
  order tracking lookup.
- **Auth & account** — login/register/forgot/reset (validated, session-persisted), profile
  edit, address book (add/edit/delete/default), saved cards (masked), notification prefs, settings.
- **Recently viewed & recommendations** — tracked on PDP; recommendations from
  `recommendedProductIds`/`relatedProductIds` with category fallback.
- **Reviews** — distribution bar chart + working write-a-review form appended to local state.

## Dev server note

`serve.json` sets `"cleanUrls": false` so `.html?query` URLs are served directly. Without it,
`serve` issues 301 redirects that strip query strings (breaking `product-detail.html?id=…`).

## Updated files

- `cart-engine.js`, `cart-page.js`, `cart-drawer.js`, `cart-ui.js`, `site-shell.js`,
  `shop-renderer.js`, `search-page.js`, `discovery-page.js`, `product-card.js`,
  `product-detail-render.js`, `checkout-page.js`, `account-page.js`
- HTML: checkout, login, register, forgot/reset-password, profile, addresses,
  payment-methods, settings, notifications, orders, order-detail, order-confirmation, cart
- `css/design-system/components/commerce.css` (states, cart, checkout, account, timeline, reviews)
- Script injection: `scripts/patch-phase4-scripts.js`

_End of Phase 4 e-commerce functionality deliverable._
