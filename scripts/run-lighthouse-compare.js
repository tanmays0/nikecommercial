/**
 * Swap homepage hero perf files before/after, run Lighthouse, print metrics.
 * Usage: node scripts/run-lighthouse-compare.js [url]
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const URL = process.argv[2] || 'http://localhost:55333';
const FILES = [
  { rel: 'js/tiger-experience.js', before: '.perf-before/tiger-experience.js', after: '.perf-baseline/tiger-experience.js' },
  { rel: 'js/main.js', before: '.perf-before/main.js', after: '.perf-baseline/main.js' },
  { rel: 'index.html', before: '.perf-before/index.html', after: '.perf-baseline/index.html' },
  { rel: 'js/site-shell.js', before: '.perf-before/site-shell.js', after: '.perf-baseline/site-shell.js' },
  { rel: 'css/styles.css', before: '.perf-before/styles.css', after: '.perf-baseline/styles.css' },
];

function ensureBeforeFromGit() {
  const dir = path.join(ROOT, '.perf-before');
  fs.mkdirSync(dir, { recursive: true });
  for (const f of FILES) {
    const out = path.join(ROOT, f.before);
    if (fs.existsSync(out)) continue;
    const content = execSync(`git show HEAD:${f.rel.replace(/\\/g, '/')}`, { cwd: ROOT, encoding: 'utf8' });
    fs.writeFileSync(out, content);
  }
}

function swap(which) {
  for (const f of FILES) {
    const src = path.join(ROOT, which === 'before' ? f.before : f.after);
    const dest = path.join(ROOT, f.rel);
    fs.copyFileSync(src, dest);
  }
}

function runLighthouse(label) {
  const outPath = path.join(ROOT, `.lighthouse-${label}.json`);
  execSync(
    `npx --yes lighthouse "${URL}" --quiet --chrome-flags="--headless=new --no-sandbox --disable-gpu" --only-categories=performance --output=json --output-path="${outPath}"`,
    { cwd: ROOT, stdio: 'inherit', timeout: 600000, maxBuffer: 50 * 1024 * 1024 }
  );
  const report = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  const a = report.audits;
  const pick = (id) => (a[id]?.numericValue != null ? Math.round(a[id].numericValue) : null);
  return {
    label,
    score: Math.round((report.categories.performance?.score || 0) * 100),
    FCP: pick('first-contentful-paint'),
    LCP: pick('largest-contentful-paint'),
    TBT: pick('total-blocking-time'),
    TTI: pick('interactive'),
    SI: pick('speed-index'),
  };
}

function printRow(m) {
  console.log(
    `${m.label.padEnd(8)} | score ${String(m.score).padStart(3)} | FCP ${String(m.FCP).padStart(5)}ms | LCP ${String(m.LCP).padStart(5)}ms | TBT ${String(m.TBT).padStart(5)}ms | TTI ${String(m.TTI).padStart(5)}ms | SI ${String(m.SI).padStart(5)}ms`
  );
}

ensureBeforeFromGit();
swap('after');

try {
  console.log(`\nLighthouse target: ${URL}\n`);
  swap('before');
  console.log('Running BEFORE (HEAD)…');
  const before = runLighthouse('before');

  swap('after');
  console.log('Running AFTER (optimized)…');
  const after = runLighthouse('after');

  console.log('\n--- Results ---');
  printRow(before);
  printRow(after);
  console.log('\nDelta (after − before, negative = improved):');
  console.log(
    `FCP ${after.FCP - before.FCP}ms | LCP ${after.LCP - before.LCP}ms | TBT ${after.TBT - before.TBT}ms | TTI ${after.TTI - before.TTI}ms | score ${after.score - before.score}`
  );
} finally {
  swap('after');
}
