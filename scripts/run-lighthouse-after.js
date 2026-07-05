/**
 * Run Lighthouse twice with a clean Chrome profile; save JSON to .perf-after/
 * Usage: node scripts/run-lighthouse-after.js [url]
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const URL = process.argv[2] || 'http://127.0.0.1:55333/';
const OUT_DIR = path.join(ROOT, '.perf-after');
const RUNS = 2;

function pickMetrics(report) {
  const a = report.audits;
  const n = (id) => (a[id]?.numericValue != null ? Math.round(a[id].numericValue) : null);
  return {
    score: Math.round((report.categories?.performance?.score || 0) * 100),
    FCP: n('first-contentful-paint'),
    LCP: n('largest-contentful-paint'),
    TBT: n('total-blocking-time'),
    TTI: n('interactive'),
    SI: n('speed-index'),
    error: report.runtimeError?.message || null,
  };
}

function median(values) {
  const nums = values.filter((v) => typeof v === 'number').sort((a, b) => a - b);
  if (!nums.length) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : Math.round((nums[mid - 1] + nums[mid]) / 2);
}

function runOnce(i) {
  const profile = path.join(os.tmpdir(), `lh-archive-${Date.now()}-${i}`);
  fs.mkdirSync(profile, { recursive: true });
  const outPath = path.join(OUT_DIR, `lighthouse-run-${i + 1}.json`);
  const chromeFlags = `--headless=new --no-sandbox --disable-gpu --user-data-dir="${profile}"`;
  execSync(
    `npx --yes lighthouse "${URL}" --quiet --chrome-flags="${chromeFlags}" --only-categories=performance --output=json --output-path="${outPath}" --max-wait-for-load=120000`,
    { cwd: ROOT, stdio: 'inherit', timeout: 600000, maxBuffer: 64 * 1024 * 1024, env: { ...process.env, CHROME_PATH: process.env.CHROME_PATH } }
  );
  const report = JSON.parse(fs.readFileSync(outPath, 'utf8'));
  return pickMetrics(report);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const results = [];
for (let i = 0; i < RUNS; i++) {
  console.log(`\n--- Lighthouse run ${i + 1}/${RUNS} ---`);
  results.push(runOnce(i));
  console.log(results[i]);
}

const medianResult = {
  score: median(results.map((r) => r.score)),
  FCP: median(results.map((r) => r.FCP)),
  LCP: median(results.map((r) => r.LCP)),
  TBT: median(results.map((r) => r.TBT)),
  TTI: median(results.map((r) => r.TTI)),
  SI: median(results.map((r) => r.SI)),
};

const summary = { url: URL, runs: results, median: medianResult, capturedAt: new Date().toISOString() };
fs.writeFileSync(path.join(OUT_DIR, 'summary.json'), JSON.stringify(summary, null, 2));
console.log('\nMedian:', medianResult);
