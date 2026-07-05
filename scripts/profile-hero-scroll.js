/**
 * Profile hero scroll via Lenis wheel input; count long rAF frames.
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

  await page.evaluate(() => {
    window.__heroProfile = { longFrames: 0, maxFrameMs: 0, frames: 0, over32: 0 };
    let last = performance.now();
    function measure() {
      const now = performance.now();
      const delta = now - last;
      last = now;
      window.__heroProfile.frames += 1;
      if (delta > 16.7) window.__heroProfile.longFrames += 1;
      if (delta > 32) window.__heroProfile.over32 += 1;
      if (delta > window.__heroProfile.maxFrameMs) window.__heroProfile.maxFrameMs = delta;
      if (window.__heroProfile.frames < 120) requestAnimationFrame(measure);
    }
    requestAnimationFrame(measure);
  });

  const heroHeight = await page.evaluate(() => document.getElementById('hero')?.offsetHeight || 3000);
  const wheels = Math.ceil(heroHeight / 600);
  for (let i = 0; i < wheels; i++) {
    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(32);
  }
  await page.waitForTimeout(500);

  const result = await page.evaluate(() => ({
    ...window.__heroProfile,
    maxFrameMs: Math.round(window.__heroProfile.maxFrameMs * 10) / 10,
    heroHeight: document.getElementById('hero')?.offsetHeight,
    scrollY: window.scrollY || document.documentElement.scrollTop,
  }));

  await browser.close();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
