'use strict';
/** Verify ARCHIVE rebrand — site-brand references should be zero in user-facing files. */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP = new Set(['node_modules', '.git', 'AUDIT.md', 'REBRAND-AUDIT.md', 'CHANGELOG.md', 'scripts/data/openverse-pool.json']);
const SITE_BRAND_PATTERNS = [
  /Velocity Athletics/g,
  /Velocity Design System/g,
  /Nike Commercial/g,
  /About Nike/g,
  /© 2026 Nike/g,
  /Nike Home/g,
  /Velocity Home/g,
  /family=Antonio/g,
  /Archivo Narrow/g,
  /#ff5500/g,
];

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(html|css|js|json|svg|md|ps1)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const hits = [];
for (const file of walk(ROOT)) {
  if (file.includes('rebrand-bulk') || file.includes('verify-rebrand')) continue;
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, 'utf8');
  for (const re of SITE_BRAND_PATTERNS) {
    re.lastIndex = 0;
    const m = text.match(re);
    if (m) hits.push({ file: rel, pattern: re.source, count: m.length });
  }
}

// Catalog integrity
const vm = require('vm');
const g = {};
g.window = g;
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/products-catalog.generated.js'), 'utf8'), vm.createContext(g));
const cat = g.__PRODUCTS_CATALOG__ || [];
const brands = {};
let auth = 0;
let withCondition = 0;
let withEra = 0;
for (const p of cat) {
  brands[p.brand] = (brands[p.brand] || 0) + 1;
  if (p.authenticated) auth++;
  if (p.condition) withCondition++;
  if (p.era) withEra++;
}

console.log('=== SITE-BRAND REFERENCE CHECK ===');
if (!hits.length) console.log('PASS — zero legacy site-brand matches in scanned files');
else {
  console.log('FAIL — remaining matches:');
  hits.forEach((h) => console.log(`  ${h.file}: ${h.pattern} (${h.count})`));
}

console.log('\n=== CATALOG ===');
console.log('Products:', cat.length);
console.log('Brands:', Object.keys(brands).length, brands);
console.log('authenticated:', auth, '| condition:', withCondition, '| era:', withEra);
console.log('Legacy aliases:', Object.keys(g.__PRODUCTS_LEGACY_ALIASES__ || {}).length);

process.exit(hits.length ? 1 : 0);
