#!/usr/bin/env node
/**
 * Tiered script bundles — load only what each page type needs.
 * Run: node scripts/patch-script-bundles.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const CDN = {
  gsap: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js',
  scrollTrigger: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js',
  lenis: 'https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js',
};

const LIB = [
  'js/lib/dom.js',
  'js/lib/format.js',
  'js/lib/validation.js',
];

const CORE = [
  'js/site-config.js',
  ...LIB,
  'js/auth-engine.js',
  'js/wishlist-engine.js',
  'js/cart-engine.js',
  'js/cart-ui.js',
  'js/cart-drawer.js',
  'js/seo.js',
  'js/site-shell.js',
];

const CATALOG = [
  'js/product-schema.js',
  'js/products-catalog.generated.js',
  'js/product-images.js',
  'js/product-card.js',
  'js/products-data.js',
  'js/mock-service.js',
  'js/pricing.js',
  'js/lib/cart-render.js',
];

const COMMERCE = [
  'js/coupon-engine.js',
  'js/account-store.js',
  'js/order-engine.js',
];

const REVIEWS = ['js/reviews-engine.js'];

const HOME_TAIL = [
  'js/tiger-experience.js',
  'js/animations.js',
  'js/main.js',
  'js/motion.js',
];

const INNER_TAIL = ['js/pages.js', 'js/motion.js'];

const PAGE_SCRIPTS = {
  'index.html': [],
  'product.html': [],
  '404.html': [],
  'error.html': [],
  'cart.html': ['js/cart-page.js'],
  'checkout.html': ['js/checkout-page.js'],
  'search.html': ['js/search-page.js'],
  'product-detail.html': ['js/product-detail-render.js', 'js/quick-view.js'],
  'shop.html': ['js/shop-render.js', 'js/quick-view.js'],
  'shop-men.html': ['js/shop-renderer.js', 'js/quick-view.js'],
  'shop-women.html': ['js/shop-renderer.js', 'js/quick-view.js'],
  'shop-kids.html': ['js/shop-renderer.js', 'js/quick-view.js'],
  'shop-accessories.html': ['js/shop-renderer.js', 'js/quick-view.js'],
  'wishlist.html': ['js/discovery-page.js'],
  'compare.html': ['js/discovery-page.js'],
  'recently-viewed.html': ['js/discovery-page.js'],
  'collection.html': ['js/collection-page.js'],
  'collections.html': ['js/collection-page.js'],
  'support.html': [],
};

const CATALOG_PAGES = new Set([
  'air-max.html', 'best-sellers.html', 'basketball.html', 'featured.html',
  'jordan.html', 'lifestyle.html', 'new-arrivals.html', 'running.html',
  'sale.html', 'training.html', 'trending.html',
]);

const CONTENT_PAGES = new Set([
  'about.html', 'accessibility.html', 'careers.html', 'contact.html',
  'faqs.html', 'gift-cards.html', 'privacy-policy.html', 'returns-policy.html',
  'shipping-info.html', 'size-guide.html', 'sustainability.html', 'terms-of-service.html',
]);

const ACCOUNT_PAGES = new Set([
  'login.html', 'register.html', 'forgot-password.html', 'reset-password.html',
  'profile.html', 'addresses.html', 'payment-methods.html', 'settings.html',
  'notifications.html', 'orders.html', 'order-detail.html', 'order-confirmation.html',
  'order-tracking.html', 'store-locator.html',
]);

function tag(src) {
  return `  <script src="${src}"></script>`;
}

function buildBundle(file) {
  // Landing page is frozen: tigerimages scrollytelling owned by main.js + tiger-experience.js.
  // Never inject site-shell, motion.js, or commerce stack here.
  if (file === 'index.html') {
    return [
      tag(CDN.gsap),
      tag(CDN.scrollTrigger),
      tag(CDN.lenis),
      tag('js/cart-engine.js'),
      tag('js/cart-ui.js'),
      tag('js/cart-drawer.js'),
      tag('js/tiger-experience.js'),
      tag('js/animations.js'),
      tag('js/main.js'),
    ];
  }

  const isHome = false;
  const isRedirect = file === 'product.html';
  const isError = file === '404.html' || file === 'error.html';

  const scripts = [tag(CDN.gsap), tag(CDN.lenis)];

  if (isHome) scripts.push(tag(CDN.scrollTrigger));

  scripts.push(...CORE.map(tag));

  if (isRedirect) {
    scripts.push(tag('js/product-render.js'));
    scripts.push(...(isHome ? HOME_TAIL : INNER_TAIL).map(tag));
    return scripts;
  }

  if (isError) {
    scripts.push(...INNER_TAIL.map(tag));
    return scripts;
  }

  const needsCatalog =
    CATALOG_PAGES.has(file) ||
    PAGE_SCRIPTS[file]?.some((s) => s.includes('shop') || s.includes('product') || s.includes('discovery') || s.includes('collection') || s.includes('search') || s.includes('cart') || s.includes('checkout')) ||
    ['cart.html', 'checkout.html', 'search.html', 'product-detail.html', 'shop.html', 'shop-men.html', 'shop-women.html', 'shop-kids.html', 'shop-accessories.html', 'wishlist.html', 'compare.html', 'recently-viewed.html', 'collection.html', 'collections.html'].includes(file);

  const needsCommerce =
    ['checkout.html', 'cart.html'].includes(file) ||
    ACCOUNT_PAGES.has(file);

  const needsReviews = file === 'product-detail.html';

  if (needsCatalog) scripts.push(...CATALOG.map(tag));
  if (needsCommerce) scripts.push(...COMMERCE.map(tag));
  if (needsReviews) scripts.push(...REVIEWS.map(tag));

  scripts.push(...(isHome ? HOME_TAIL : INNER_TAIL).map(tag));

  const pageSpecific = PAGE_SCRIPTS[file] || [];
  if (CATALOG_PAGES.has(file)) pageSpecific.push('js/catalog-page.js', 'js/quick-view.js');
  if (CONTENT_PAGES.has(file)) pageSpecific.push('js/content-page.js');
  if (ACCOUNT_PAGES.has(file)) pageSpecific.push('js/account-page.js');

  pageSpecific.forEach((s) => {
    if (!scripts.some((t) => t.includes(`"${s}"`))) scripts.push(tag(s));
  });

  return scripts;
}

function patch(file) {
  const full = path.join(ROOT, file);
  let html = fs.readFileSync(full, 'utf8');

  const start = html.indexOf('<script src="https://cdn.jsdelivr.net/npm/gsap');
  const end = html.lastIndexOf('</body>');
  if (start === -1 || end === -1) return 'skip';

  const before = html.slice(0, start);
  const after = html.slice(end);
  const bundle = buildBundle(file).join('\n');
  html = `${before}${bundle}\n\n${after}`;
  fs.writeFileSync(full, html, 'utf8');
  return 'patched';
}

const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const summary = { patched: [], skip: [] };
files.forEach((f) => summary[patch(f)].push(f));
process.stdout.write(`patched ${summary.patched.length} pages\n`);
