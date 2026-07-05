/**
 * Insert product data layer scripts before products-data.js in all HTML pages.
 * Run: node scripts/patch-product-scripts.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INSERT = [
  '  <script src="js/product-schema.js"></script>',
  '  <script src="js/products-catalog.generated.js"></script>',
  '  <script src="js/product-images.js"></script>',
  '  <script src="js/product-card.js"></script>',
].join('\n');

const MARKERS = [
  'js/product-schema.js',
  'js/products-catalog.generated.js',
  'js/product-images.js',
  'js/product-card.js',
];

function patchFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  if (!html.includes('js/products-data.js')) return false;
  if (MARKERS.every((m) => html.includes(m))) return false;

  html = html.replace(
    /(\s*)<script src="js\/products-data\.js"><\/script>/,
    `\n${INSERT}\n$1<script src="js/products-data.js"></script>`
  );

  fs.writeFileSync(filePath, html, 'utf8');
  return true;
}

const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
let patched = 0;

files.forEach((f) => {
  if (patchFile(path.join(ROOT, f))) {
    patched += 1;
    console.log('patched', f);
  }
});

console.log(`Done. Patched ${patched} file(s).`);
