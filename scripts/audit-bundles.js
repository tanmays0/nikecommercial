'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const PAGES = {
  'shop.html': 'shop-render.js',
  'shop-men.html': 'shop-renderer.js',
  'shop-women.html': 'shop-renderer.js',
  'shop-kids.html': 'shop-renderer.js',
  'shop-accessories.html': 'shop-renderer.js',
  'new-arrivals.html': 'catalog-page.js',
  'best-sellers.html': 'catalog-page.js',
  'trending.html': 'catalog-page.js',
  'featured.html': 'catalog-page.js',
  'sale.html': 'catalog-page.js',
  'running.html': 'catalog-page.js',
  'training.html': 'catalog-page.js',
  'basketball.html': 'catalog-page.js',
  'lifestyle.html': 'catalog-page.js',
  'jordan.html': 'catalog-page.js',
  'air-max.html': 'catalog-page.js',
  'collections.html': 'collection-page.js',
  'collection.html': 'collection-page.js',
  'search.html': 'search-page.js',
};

// Required deps and the order that must hold (schema < catalog < card < data)
const ORDER = ['js/product-schema.js', 'js/products-catalog.generated.js', 'js/product-card.js', 'js/products-data.js'];

for (const [file, renderer] of Object.entries(PAGES)) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) { console.log(`${file.padEnd(22)} MISSING FILE`); continue; }
  const h = fs.readFileSync(full, 'utf8');
  const scripts = [...h.matchAll(/<script src="(js\/[^"]+)"/g)].map((m) => m[1]);
  const idx = (s) => scripts.indexOf(s);
  const problems = [];

  // renderer present?
  if (!scripts.includes('js/' + renderer)) problems.push('NO_RENDERER(' + renderer + ')');

  // required deps present?
  for (const dep of ORDER) if (!scripts.includes(dep)) problems.push('MISSING:' + dep.replace('js/', ''));

  // order: each ORDER dep must come before the renderer and in relative order
  const rIdx = idx('js/' + renderer);
  for (const dep of ORDER) {
    const di = idx(dep);
    if (di !== -1 && rIdx !== -1 && di > rIdx) problems.push('AFTER_RENDERER:' + dep.replace('js/', ''));
  }
  // schema before data
  if (idx('js/product-schema.js') > idx('js/products-data.js') && idx('js/products-data.js') !== -1)
    problems.push('SCHEMA_AFTER_DATA');
  if (idx('js/products-catalog.generated.js') > idx('js/products-data.js') && idx('js/products-data.js') !== -1)
    problems.push('CATALOG_AFTER_DATA');

  console.log(`${file.padEnd(22)} ${problems.length ? problems.join(' ') : 'OK'}`);
}
