#!/usr/bin/env node
/**
 * Generate sitemap.xml from public HTML pages in the project root.
 * Run: node scripts/generate-sitemap.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE = process.env.SITE_URL || 'https://archive.market';
const SKIP = new Set(['404.html', 'error.html', 'product.html']);

const files = fs
  .readdirSync(ROOT)
  .filter((f) => f.endsWith('.html') && !SKIP.has(f))
  .sort();

const urls = files.map((f) => {
  const stat = fs.statSync(path.join(ROOT, f));
  const loc = `${BASE}/${f}`;
  const lastmod = stat.mtime.toISOString().slice(0, 10);
  const priority = f === 'index.html' ? '1.0' : f.includes('shop') || f === 'product-detail.html' ? '0.9' : '0.7';
  return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
});

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;

fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml, 'utf8');
process.stdout.write(`sitemap.xml — ${files.length} URLs\n`);
