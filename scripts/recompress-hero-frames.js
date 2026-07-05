/**
 * Recompress existing WebP hero frames to hit payload target.
 * Usage: node scripts/recompress-hero-frames.js [dir] [quality]
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC_DIR = path.resolve(ROOT, process.argv[2] || 'tigerimages');
const OUT_DIR = path.resolve(ROOT, process.argv[3] || `${SRC_DIR}-opt`);
const QUALITY = Number(process.argv[4] || 54);

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.webp') && !f.startsWith('.tmp-')).sort();
  console.log(`Recompressing ${files.length} WebP files to ${OUT_DIR} at quality ${QUALITY}`);

  for (let i = 0; i < files.length; i++) {
    const name = files[i];
    const src = path.join(SRC_DIR, name);
    const dest = path.join(OUT_DIR, name);
    await sharp(src).webp({ quality: QUALITY, effort: 5 }).toFile(dest);
    if ((i + 1) % 24 === 0 || i === files.length - 1) process.stdout.write(`\r${i + 1}/${files.length}`);
  }

  console.log('\nDone.');
  const bytes = files.reduce((sum, f) => sum + fs.statSync(path.join(OUT_DIR, f)).size, 0);
  console.log(
    JSON.stringify({
      count: files.length,
      totalMb: Math.round((bytes / (1024 * 1024)) * 10) / 10,
      avgKb: Math.round(bytes / files.length / 1024),
      outDir: OUT_DIR,
    })
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
