const fs = require('fs');
const path = require('path');
const file = process.argv[2];
const report = JSON.parse(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'));
const a = report.audits;
const pick = (id) => (a[id]?.numericValue != null ? Math.round(a[id].numericValue) : null);
const score = Math.round((report.categories.performance?.score || 0) * 100);
console.log(JSON.stringify({
  score,
  FCP: pick('first-contentful-paint'),
  LCP: pick('largest-contentful-paint'),
  TBT: pick('total-blocking-time'),
  TTI: pick('interactive'),
  SI: pick('speed-index'),
}, null, 2));
