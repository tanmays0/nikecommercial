#!/usr/bin/env node
/**
 * Replace legacy inline header/footer on inner pages with site-shell mounts.
 * Does NOT touch index.html (landing / tiger hero).
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const FILES = [
  'shop.html',
  'shop-men.html',
  'shop-women.html',
  'shop-kids.html',
  'shop-accessories.html',
  'cart.html',
  'product-detail.html',
  'support.html',
  'product.html',
];

const HEADER_RE = /[\s\S]*?<a class="skip-link"[^>]*>[\s\S]*?<\/a>\s*/;
const INLINE_HEADER_RE = /<!-- Site Header -->[\s\S]*?<\/header>\s*|<!-- Header -->[\s\S]*?<\/header>\s*|<header class="site-header"[\s\S]*?<\/header>\s*/;
const INLINE_FOOTER_RE = /<!-- Footer -->[\s\S]*?<\/footer>\s*|<footer class="site-footer"[\s\S]*?<\/footer>\s*/;

function migrate(file) {
  const full = path.join(ROOT, file);
  if (!fs.existsSync(full)) return 'missing';

  let html = fs.readFileSync(full, 'utf8');
  if (html.includes('site-header-mount')) return 'skip';

  if (!INLINE_HEADER_RE.test(html)) return 'no-header';

  html = html.replace(
    INLINE_HEADER_RE,
    `<div id="site-header-mount"></div>\n\n  `
  );

  if (INLINE_FOOTER_RE.test(html)) {
    html = html.replace(INLINE_FOOTER_RE, `<div id="site-footer-mount"></div>\n\n  `);
  }

  fs.writeFileSync(full, html, 'utf8');
  return 'migrated';
}

FILES.forEach((f) => {
  process.stdout.write(`${f}: ${migrate(f)}\n`);
});
