/**
 * Measure every hero frame: dimensions + file size.
 * Usage: node scripts/measure-hero-frames.js [dir]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIR = path.resolve(ROOT, process.argv[2] || 'tigerimages');

function jpegDimensions(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) break;
    const marker = buf[i + 1];
    if (marker === 0xc0 || marker === 0xc2) {
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 9) };
    }
    const len = buf.readUInt16BE(i + 2);
    i += 2 + len;
  }
  return null;
}

function webpDimensions(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') {
    const w = buf.readUInt16LE(26) & 0x3fff;
    const h = buf.readUInt16LE(28) & 0x3fff;
    return { width: w, height: h };
  }
  if (chunk === 'VP8L') {
    const bits = buf.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X') {
    const w = 1 + buf.readUIntLE(24, 3);
    const h = 1 + buf.readUIntLE(27, 3);
    return { width: w, height: h };
  }
  return null;
}

function readDims(filePath, buf) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return jpegDimensions(buf);
  if (ext === '.webp') return webpDimensions(buf);
  return null;
}

if (!fs.existsSync(DIR)) {
  console.error('Missing directory:', DIR);
  process.exit(1);
}

const files = fs.readdirSync(DIR).filter((f) => /\.(jpe?g|webp)$/i.test(f)).sort();
let totalBytes = 0;
const widths = new Set();
const heights = new Set();
const samples = [];

for (const name of files) {
  const fp = path.join(DIR, name);
  const stat = fs.statSync(fp);
  totalBytes += stat.size;
  const buf = fs.readFileSync(fp);
  const dims = readDims(fp, buf);
  if (dims) {
    widths.add(dims.width);
    heights.add(dims.height);
    if (samples.length < 3 || name.endsWith('242.jpg') || name.includes('242')) {
      samples.push({ name, ...dims, kb: Math.round(stat.size / 1024) });
    }
  }
}

const count = files.length;
const avgKb = count ? Math.round(totalBytes / count / 1024) : 0;
const totalMb = Math.round((totalBytes / (1024 * 1024)) * 10) / 10;

console.log(JSON.stringify({
  directory: DIR,
  count,
  totalBytes,
  totalMb,
  avgKb,
  uniqueWidths: [...widths],
  uniqueHeights: [...heights],
  samples,
  first: files[0],
  last: files[files.length - 1],
}, null, 2));
