/**
 * Diagnostic: load the real browser data pipeline in Node and report
 * per-page product counts + identity/image integrity. Read-only.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');

// Use a single object as BOTH the global scope and `window`, so that
// `window.X = ...` in the scripts creates a global `X` (as in a browser).
const g = {
  console,
  Intl,
  URLSearchParams,
  document: { addEventListener() {} },
  matchMedia: () => ({ matches: false, addEventListener() {} }),
  location: { search: '', pathname: '/', href: 'http://x/' },
};
g.window = g;
g.globalThis = g;
const ctx = vm.createContext(g);
const sandbox = { window: g };

const LOAD = [
  'js/lib/dom.js',
  'js/product-schema.js',
  'js/products-catalog.generated.js',
  'js/product-images.js',
  'js/product-card.js',
  'js/products-data.js',
  'js/site-config.js',
];

for (const rel of LOAD) {
  const code = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  try {
    vm.runInContext(code, ctx, { filename: rel });
  } catch (e) {
    console.log(`LOAD ERROR in ${rel}: ${e.message}`);
  }
}

const W = sandbox.window;
const PD = W.ProductsData;
const SC = W.SiteConfig;

console.log('=== DATA SOURCE ===');
console.log('Raw catalog entries:', (W.__PRODUCTS_CATALOG__ || []).length);
console.log('ProductsData.PRODUCTS:', PD ? PD.PRODUCTS.length : 'N/A');
console.log('ProductCard defined:', !!W.ProductCard);

const RAW = PD.RAW_PRODUCTS;

console.log('\n=== PER-PAGE COUNTS ===');
const rows = [];
rows.push(['Shop / All Products', RAW.length]);
for (const cat of ['men', 'women', 'kids', 'accessories']) {
  rows.push([`Shop → ${cat}`, PD.getProductsByCategory(cat).length]);
}
for (const id of ['new-arrivals', 'best-sellers', 'trending', 'sale', 'featured']) {
  rows.push([id, SC.getCatalogProducts(id).length]);
}
for (const c of SC.COLLECTIONS) {
  rows.push([`collection:${c.slug}`, SC.getCollectionProducts(c.slug).length]);
}
rows.forEach(([n, c]) => console.log(`${String(n).padEnd(26)} ${c}`));

console.log('\n=== TAG COVERAGE ===');
console.log('isNew:', RAW.filter((p) => p.isNew).length);
console.log('isBestSeller:', RAW.filter((p) => p.isBestSeller).length);
console.log('tags.trending:', RAW.filter((p) => p.tags.includes('trending')).length);
console.log('isTrending field:', RAW.filter((p) => p.isTrending).length);
console.log('onSale (compareAt>price):', RAW.filter((p) => p.compareAtPrice && p.compareAtPrice > p.price).length);
console.log('collectionIds field present:', RAW.filter((p) => Array.isArray(p.collectionIds)).length);

console.log('\n=== IDENTITY AUDIT ===');
const names = new Map();
const skus = new Map();
const descs = new Map();
for (const p of RAW) {
  names.set(p.name, (names.get(p.name) || 0) + 1);
  skus.set(p.sku, (skus.get(p.sku) || 0) + 1);
  descs.set(p.description, (descs.get(p.description) || 0) + 1);
}
const dupNames = [...names].filter(([, c]) => c > 1);
const dupSkus = [...skus].filter(([, c]) => c > 1);
const dupDescs = [...descs].filter(([, c]) => c > 1);
console.log('Duplicate names:', dupNames.length, dupNames.slice(0, 8));
console.log('Duplicate SKUs:', dupSkus.length, dupSkus.slice(0, 8));
console.log('Duplicate descriptions:', dupDescs.length);

console.log('\n=== IMAGE AUDIT ===');
const under3 = RAW.filter((p) => (p.images || []).length < 3);
console.log('Products with <3 images:', under3.length);
const imgOwners = new Map();
for (const p of RAW) {
  const urls = new Set((p.images || []).map((i) => (typeof i === 'string' ? i : i.url)));
  for (const c of p.colors || []) for (const i of c.images || []) urls.add(typeof i === 'string' ? i : i.url);
  for (const u of urls) {
    if (!imgOwners.has(u)) imgOwners.set(u, new Set());
    imgOwners.get(u).add(p.id);
  }
}
const crossDup = [...imgOwners].filter(([, owners]) => owners.size > 1);
console.log('Distinct image URLs:', imgOwners.size);
console.log('Images shared across DIFFERENT products:', crossDup.length);
crossDup.slice(0, 10).forEach(([u, owners]) => console.log('  ', u.slice(0, 60), '->', [...owners].length, 'products'));

// Report which collection productIds resolve
console.log('\n=== COLLECTION ID RESOLUTION ===');
for (const c of SC.COLLECTIONS) {
  const missing = c.productIds.filter((id) => !PD.getRawProductById(id));
  console.log(`${c.slug}: ${c.productIds.length} ids, ${missing.length} missing`, missing);
}
