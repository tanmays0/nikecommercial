/**
 * Segment hero scroll jank by progress through the hero (0–33%, 34–66%, 67–100%).
 */
const { chromium } = require('playwright');

const URL = process.argv[2] || 'http://127.0.0.1:55333/';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(
    () => !document.getElementById('hero-loader') && !document.body.classList.contains('is-hero-loading'),
    { timeout: 180000 }
  );

  const result = await page.evaluate(async () => {
    const hero = document.getElementById('hero');
    const heroH = hero?.offsetHeight || 6400;
    const buckets = [
      { label: '0-33%', long: 0, max: 0, samples: 0 },
      { label: '34-66%', long: 0, max: 0, samples: 0 },
      { label: '67-100%', long: 0, max: 0, samples: 0 },
    ];

    function bucketFor(y) {
      const p = y / heroH;
      if (p < 0.34) return 0;
      if (p < 0.67) return 1;
      return 2;
    }

    let last = performance.now();
    let measuring = true;
    requestAnimationFrame(function loop() {
      if (!measuring) return;
      const now = performance.now();
      const delta = now - last;
      last = now;
      const y = window.scrollY || document.documentElement.scrollTop;
      const b = buckets[bucketFor(y)];
      b.samples += 1;
      if (delta > 16.7) b.long += 1;
      if (delta > b.max) b.max = delta;
      requestAnimationFrame(loop);
    });

    // Smooth wheel through full hero
    const steps = 80;
    for (let i = 0; i <= steps; i++) {
      window.scrollTo(0, (heroH * i) / steps);
      await new Promise((r) => setTimeout(r, 20));
    }
    measuring = false;
    await new Promise((r) => setTimeout(r, 100));

    return {
      heroHeight: heroH,
      finalScrollY: window.scrollY || document.documentElement.scrollTop,
      buckets: buckets.map((b) => ({
        ...b,
        maxMs: Math.round(b.max * 10) / 10,
        pctLong: b.samples ? Math.round((b.long / b.samples) * 100) : 0,
      })),
      totalLong: buckets.reduce((s, b) => s + b.long, 0),
      totalSamples: buckets.reduce((s, b) => s + b.samples, 0),
    };
  });

  await browser.close();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
