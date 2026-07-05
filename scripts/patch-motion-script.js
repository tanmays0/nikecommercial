#!/usr/bin/env node
/**
 * Idempotently inject <script src="js/motion.js"></script> into inner pages only.
 * index.html is excluded — the tigerimages hero is owned by main.js.
 * - fallback: before </body> if neither anchor exists.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TAG = '  <script src="js/motion.js"></script>';

function patch(file) {
  const full = path.join(ROOT, file);
  let html = fs.readFileSync(full, 'utf8');

  // Landing page: skip — hero script stack is hand-maintained.
  if (file === 'index.html') return 'skip';

  if (html.includes('js/motion.js')) return 'skip';

  const afterMain = /([ \t]*<script src="js\/main\.js"><\/script>)/;
  const afterPages = /([ \t]*<script src="js\/pages\.js"><\/script>)/;

  if (file === 'index.html' && afterMain.test(html)) {
    html = html.replace(afterMain, `$1\n${TAG}`);
  } else if (afterPages.test(html)) {
    html = html.replace(afterPages, `$1\n${TAG}`);
  } else if (afterMain.test(html)) {
    html = html.replace(afterMain, `$1\n${TAG}`);
  } else if (html.includes('</body>')) {
    html = html.replace('</body>', `${TAG}\n</body>`);
  } else {
    return 'no-anchor';
  }

  fs.writeFileSync(full, html, 'utf8');
  return 'patched';
}

const files = fs
  .readdirSync(ROOT)
  .filter((f) => f.endsWith('.html'));

const summary = { patched: [], skip: [], 'no-anchor': [] };
for (const f of files) {
  summary[patch(f)].push(f);
}

console.log(`patched (${summary.patched.length}):`, summary.patched.join(', '));
console.log(`skipped (${summary.skip.length}, already present)`);
if (summary['no-anchor'].length) {
  console.log('NO ANCHOR:', summary['no-anchor'].join(', '));
}
