/**
 * Resize hero frames to max 1920px width, export WebP, remove source JPGs.
 * Usage: node scripts/resize-hero-frames.js [dir] [--dry-run]
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const DIR = path.resolve(ROOT, process.argv[2] || 'tigerimages');
const DRY = process.argv.includes('--dry-run');
const MAX_WIDTH = 1920;
const WEBP_QUALITY = 82;

async function main() {
  if (!fs.existsSync(DIR)) {
    console.error('Missing directory:', DIR);
    process.exit(1);
  }

  const jpgs = fs
    .readdirSync(DIR)
    .filter((f) => /\.jpe?g$/i.test(f))
    .sort();

  console.log(`Processing ${jpgs.length} frames in ${DIR} (max width ${MAX_WIDTH}, WebP q${WEBP_QUALITY})`);

  let totalOut = 0;
  for (let i = 0; i < jpgs.length; i++) {
    const name = jpgs[i];
    const src = path.join(DIR, name);
    const outName = name.replace(/\.jpe?g$/i, '.webp');
    const dest = path.join(DIR, outName);

    if (!DRY) {
      const meta = await sharp(src).metadata();
      const pipeline = sharp(src).resize({
        width: Math.min(MAX_WIDTH, meta.width || MAX_WIDTH),
        withoutEnlargement: true,
      });
      await pipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toFile(dest);
      const outStat = fs.statSync(dest);
      totalOut += outStat.size;
      fs.unlinkSync(src);
    }

    if ((i + 1) % 24 === 0 || i === jpgs.length - 1) {
      process.stdout.write(`\r${i + 1}/${jpgs.length}`);
    }
  }

  console.log('\nDone.');
  if (!DRY) {
    const webps = fs.readdirSync(DIR).filter((f) => f.endsWith('.webp'));
    const bytes = webps.reduce((sum, f) => sum + fs.statSync(path.join(DIR, f)).size, 0);
    console.log(
      JSON.stringify({
        count: webps.length,
        totalMb: Math.round((bytes / (1024 * 1024)) * 10) / 10,
        avgKb: Math.round(bytes / webps.length / 1024),
      })
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
