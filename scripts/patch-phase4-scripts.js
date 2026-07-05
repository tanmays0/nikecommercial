/**
 * Insert Phase 4 engine scripts after products-data.js in all HTML pages.
 * Idempotent: only inserts modules that are missing, in order.
 * Run: node scripts/patch-phase4-scripts.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// Ordered; each is inserted after the previous existing anchor.
const MODULES = [
  'js/mock-service.js',
  'js/pricing.js',
  'js/coupon-engine.js',
  'js/auth-engine.js',
  'js/account-store.js',
  'js/order-engine.js',
  'js/reviews-engine.js',
];

function tag(m) {
  return `  <script src="${m}"></script>`;
}

function patchFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf8');
  if (!html.includes('js/products-data.js')) return false;

  let changed = false;
  let anchor = 'js/products-data.js';

  MODULES.forEach((mod) => {
    if (html.includes(`src="${mod}"`)) {
      anchor = mod;
      return;
    }
    const anchorTag = new RegExp(`(\\s*)<script src="${anchor.replace(/[/.]/g, '\\$&')}"></script>`);
    if (anchorTag.test(html)) {
      html = html.replace(anchorTag, `$1<script src="${anchor}"></script>\n${tag(mod)}`);
      anchor = mod;
      changed = true;
    }
  });

  if (changed) fs.writeFileSync(filePath, html, 'utf8');
  return changed;
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
