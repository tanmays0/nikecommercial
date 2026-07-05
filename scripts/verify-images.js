'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const g = {};
g.window = g; g.globalThis = g;
const ctx = vm.createContext(g);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'products-catalog.generated.js'), 'utf8'), ctx);
const cat = g.__PRODUCTS_CATALOG__;

function imgs(p) {
  const out = [];
  for (const i of p.images || []) out.push(i);
  for (const c of p.colors || []) for (const i of c.images || []) out.push(i);
  return out;
}

// Cross-product duplicate check
const urlToProducts = new Map();
for (const p of cat) {
  const urls = new Set(imgs(p).map((i) => i.url));
  for (const u of urls) {
    if (!urlToProducts.has(u)) urlToProducts.set(u, new Set());
    urlToProducts.get(u).add(p.id);
  }
}
let crossDupes = 0;
for (const [u, ids] of urlToProducts) if (ids.size > 1) { crossDupes++; if (crossDupes <= 5) console.log('SHARED across', [...ids].join(','), '->', u); }
console.log('Cross-product shared image URLs:', crossDupes);

// per-product min images & source flags
let under3 = 0;
const bucket = {};
for (const p of cat) {
  if (imgs(p).length < 3) under3++;
  bucket[p.imageSource] = (bucket[p.imageSource] || 0) + 1;
}
console.log('Products with <3 images:', under3);
console.log('Product imageSource buckets:', JSON.stringify(bucket));

// unverified slots
const unver = [];
for (const p of cat) for (const i of imgs(p)) if (i.source === 'unverified') unver.push(`${p.name} :: ${i.url}`);
console.log('Unverified image slots:', unver.length);
unver.forEach((u) => console.log('  ', u));

// any leftover picsum/random?
const bad = [];
for (const p of cat) for (const i of imgs(p)) if (/picsum\.photos/.test(i.url)) bad.push(i.url);
console.log('Remaining picsum(random) URLs:', bad.length);

// spot-check 10 across categories
console.log('\n--- SPOT CHECK (primary image vs description) ---');
const byCat = {};
for (const p of cat) { (byCat[p.category] = byCat[p.category] || []).push(p); }
const picks = [];
for (const c of Object.keys(byCat)) picks.push(...byCat[c].slice(0, 3));
picks.slice(0, 10).forEach((p) => {
  console.log(`\n[${p.category}/${p.subcategory}] ${p.name} (${p.imageSource})`);
  console.log('  color:', p.colors[0].name, '| primary:', p.images[0].url.slice(0, 70));
});
