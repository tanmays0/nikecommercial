'use strict';
/**
 * ARCHIVE rebrand — bulk head/meta + comment-header pass.
 * Non-destructive, logs every file changed. Run: node scripts/rebrand-bulk.js
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400&display=swap" rel="stylesheet">
  <link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap" rel="stylesheet">`;

const FAVICON = `<link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="mask-icon" href="favicon.svg" color="#181510">
  <link rel="apple-touch-icon" href="apple-touch-icon.svg">`;

function listHtml(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => path.join(dir, f));
}

function rebrandTitleText(s) {
  return s
    .replace(/\s*[—\-|]\s*Velocity Athletics/g, ' — ARCHIVE')
    .replace(/\s*[—\-|]\s*Nike\b/g, ' — ARCHIVE')
    .replace(/Velocity Athletics/g, 'ARCHIVE')
    .replace(/\bNike\b/g, 'ARCHIVE')
    .replace(/\bVelocity\b/g, 'ARCHIVE');
}

let changed = 0;
const log = [];

for (const file of listHtml(ROOT)) {
  let src = fs.readFileSync(file, 'utf8');
  const before = src;

  // fonts link (Antonio + Archivo Narrow, any variant)
  src = src.replace(
    /<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Antonio[^"]*"\s+rel="stylesheet">/g,
    FONTS
  );

  // favicon
  src = src.replace(/<link rel="icon" href="data:,">/g, FAVICON);

  // theme-color
  src = src.replace(/(<meta name="theme-color" content=")#0b0b0b(">)/g, '$1#181510$2');

  // <title>
  src = src.replace(/<title>([\s\S]*?)<\/title>/g, (m, inner) => `<title>${rebrandTitleText(inner)}</title>`);

  // meta description
  src = src.replace(/(<meta name="description" content=")([\s\S]*?)(">)/g, (m, a, inner, b) => a + rebrandTitleText(inner) + b);

  if (src !== before) {
    fs.writeFileSync(file, src);
    changed++;
    log.push(path.basename(file));
  }
}

// Comment headers across css + js (skip generated catalog + this script)
function walk(dir, exts, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, exts, acc);
    else if (exts.some((x) => e.name.endsWith(x))) acc.push(p);
  }
  return acc;
}

let hdrChanged = 0;
for (const file of [...walk(path.join(ROOT, 'css'), ['.css']), ...walk(path.join(ROOT, 'js'), ['.js'])]) {
  if (file.includes('products-catalog.generated')) continue;
  let src = fs.readFileSync(file, 'utf8');
  const before = src;
  src = src
    .replace(/Velocity Design System/g, 'ARCHIVE Design System')
    .replace(/Velocity Athletics —/g, 'ARCHIVE —')
    .replace(/Nike Commercial —/g, 'ARCHIVE —');
  if (src !== before) {
    fs.writeFileSync(file, src);
    hdrChanged++;
  }
}

console.log(`HTML head rebranded: ${changed} files`);
console.log(log.join(', '));
console.log(`Comment headers rebranded: ${hdrChanged} files`);
