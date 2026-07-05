/**
 * Fetches keyword-matched image pools from the Openverse API and caches them
 * to scripts/data/openverse-pool.json. Query-based (returns images matching a
 * text query) with tags/title metadata for relevance validation.
 *
 * Resumable + throttled (Openverse anon: 20/min, 200/day). Re-running only
 * fetches keywords/pages not already cached.
 *
 * Run: node scripts/fetch-openverse-cache.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUT_DIR = path.join(__dirname, 'data');
const OUT = path.join(OUT_DIR, 'openverse-pool.json');

// keyword -> number of pages (20 results each) to collect
const FETCH_PLAN = {
  sneaker: 8,
  'running shoe': 4,
  'basketball shoe': 3,
  hoodie: 5,
  't-shirt': 4,
  jacket: 3,
  sweatpants: 3,
  leggings: 3,
  'tank top': 2,
  shorts: 2,
  backpack: 3,
  'duffel bag': 2,
  'baseball cap': 2,
  beanie: 2,
  'tote bag': 2,
  basketball: 2,
  gloves: 2,
  trousers: 2,
};

const THROTTLE_MS = 3500; // ~17/min, under the 20/min burst cap

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      { headers: { 'User-Agent': 'archive-marketplace/1.0 (catalog image sourcing)' } },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      }
    );
    req.on('error', reject);
    req.setTimeout(20000, () => req.destroy(new Error('timeout')));
  });
}

function simplify(r) {
  return {
    url: r.url,
    thumbnail: r.thumbnail || null,
    width: r.width || 800,
    height: r.height || 1000,
    title: (r.title || '').toLowerCase(),
    tags: (r.tags || []).map((t) => String(t.name || '').toLowerCase()),
    provider: r.provider || null,
    license: r.license || null,
  };
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const cache = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {};

  let requests = 0;
  for (const [keyword, pages] of Object.entries(FETCH_PLAN)) {
    const existing = cache[keyword] || [];
    const haveUrls = new Set(existing.map((r) => r.url));
    const pagesHave = Math.ceil(existing.length / 20);
    if (existing.length >= pages * 18) {
      console.log(`skip "${keyword}" (cached ${existing.length})`);
      continue;
    }

    const collected = existing.slice();
    for (let page = pagesHave + 1; page <= pages; page++) {
      const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(keyword)}&page=${page}&page_size=20&mature=false`;
      try {
        if (requests > 0) await sleep(THROTTLE_MS);
        const { status, body } = await get(url);
        requests++;
        if (status !== 200) {
          console.log(`  "${keyword}" p${page} -> HTTP ${status} (stopping this keyword)`);
          break;
        }
        const data = JSON.parse(body);
        const results = (data.results || []).map(simplify).filter((r) => r.url);
        let added = 0;
        for (const r of results) {
          if (!haveUrls.has(r.url)) {
            haveUrls.add(r.url);
            collected.push(r);
            added++;
          }
        }
        console.log(`  "${keyword}" p${page} +${added} (total ${collected.length})`);
        cache[keyword] = collected;
        fs.writeFileSync(OUT, JSON.stringify(cache));
        if (results.length === 0) break;
      } catch (e) {
        console.log(`  "${keyword}" p${page} ERROR ${e.message}`);
        break;
      }
    }
  }

  const totals = Object.entries(cache).map(([k, v]) => `${k}:${v.length}`);
  const allUrls = new Set();
  Object.values(cache).forEach((arr) => arr.forEach((r) => allUrls.add(r.url)));
  console.log('\nRequests made:', requests);
  console.log('Pool per keyword:', totals.join(', '));
  console.log('Total distinct pool images:', allUrls.size);
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
