'use strict';
const fs = require('fs');
const path = require('path');
const g = { window: {} };
const vm = require('vm');
const ctx = vm.createContext(g);
g.window = g;
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', 'products-catalog.generated.js'), 'utf8'), ctx);
const cat = g.__PRODUCTS_CATALOG__;
const buckets = {};
let total = 0;
for (const p of cat) {
  const urls = [];
  for (const i of p.images || []) urls.push(typeof i === 'string' ? i : i.url);
  for (const c of p.colors || []) for (const i of c.images || []) urls.push(typeof i === 'string' ? i : i.url);
  for (const u of urls) {
    total++;
    let src = 'other';
    if (u.includes('picsum.photos')) src = 'picsum(random)';
    else if (u.includes('images.unsplash.com')) src = 'unsplash(fixed-id)';
    else if (u.includes('loremflickr')) src = 'loremflickr';
    else if (u.startsWith('assets/')) src = 'local-curated';
    buckets[src] = (buckets[src] || 0) + 1;
  }
}
console.log('Total image slots:', total);
Object.entries(buckets).forEach(([k, v]) => console.log(`${k.padEnd(20)} ${v}`));
