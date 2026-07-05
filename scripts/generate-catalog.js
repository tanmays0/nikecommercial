/**
 * Generates js/products-catalog.generated.js — ~100 products, full schema
 * Run: node scripts/generate-catalog.js
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'js', 'products-catalog.generated.js');

const ANGLES = ['front', 'side', 'back', 'angled', 'lifestyle'];
const INVENTORY = ['in_stock', 'low_stock', 'out_of_stock', 'backorder'];

// ---------------------------------------------------------------------------
// Keyword-matched image sourcing (Openverse pool + validation + flagging)
// ---------------------------------------------------------------------------
const POOL_PATH = path.join(__dirname, 'data', 'openverse-pool.json');
const POOL = fs.existsSync(POOL_PATH) ? JSON.parse(fs.readFileSync(POOL_PATH, 'utf8')) : {};
if (!Object.keys(POOL).length) {
  console.warn('WARNING: openverse-pool.json is empty. Run scripts/fetch-openverse-cache.js first.');
}

const usedImageUrls = new Set();
let lockCounter = 1;

const COLOR_TOKENS = {
  Black: ['black'],
  White: ['white'],
  'Photon Dust': ['grey', 'gray', 'silver'],
  'Midnight Navy': ['navy', 'blue'],
  'University Red': ['red', 'crimson'],
  Volt: ['volt', 'lime', 'yellow', 'green'],
  'Olive Aura': ['olive', 'green'],
  'Rose Whisper': ['pink', 'rose'],
  'Hyper Pink': ['pink', 'magenta'],
  Ironstone: ['grey', 'gray', 'charcoal'],
};
function colorTokensFor(name) {
  return COLOR_TOKENS[name] || [String(name).toLowerCase()];
}
function colorWord(name) {
  return colorTokensFor(name)[0];
}

/** Resolve a product's own image search terms from its real attributes. */
function resolveType(tpl, name) {
  const n = name.toLowerCase();
  if (tpl.sub === 'shoes') {
    const style = /\b(mid|high)\b/.test(n) ? 'high-top' : 'low-top';
    const base = ['shoe', 'sneaker', 'footwear', 'trainer'];
    if (tpl.brandLine === 'Running') return { label: 'running shoe', keywords: ['running shoe', 'sneaker'], typeTokens: [...base, 'running'], style };
    if (tpl.brandLine === 'Basketball') return { label: 'basketball shoe', keywords: ['basketball shoe', 'sneaker'], typeTokens: [...base, 'basketball'], style };
    if (tpl.brandLine === 'Jordan') return { label: 'basketball sneaker', keywords: ['sneaker', 'basketball shoe'], typeTokens: base, style };
    return { label: 'sneaker', keywords: ['sneaker', 'running shoe'], typeTokens: base, style };
  }
  if (tpl.sub === 'apparel') {
    if (/hoodie|fleece|crew/.test(n)) return { label: 'hoodie', keywords: ['hoodie'], typeTokens: ['hoodie', 'sweatshirt', 'sweater'], style: 'pullover' };
    if (/jogger|sweatpant/.test(n)) return { label: 'joggers', keywords: ['sweatpants', 'trousers'], typeTokens: ['sweatpants', 'joggers', 'pants', 'trousers'], style: 'tapered' };
    if (/pant|cargo/.test(n)) return { label: 'trousers', keywords: ['trousers', 'sweatpants'], typeTokens: ['pants', 'trousers', 'chinos'], style: 'straight' };
    if (/legging|tight/.test(n)) return { label: 'leggings', keywords: ['leggings'], typeTokens: ['leggings', 'tights'], style: 'high-waist' };
    if (/bra|tank/.test(n)) return { label: 'tank top', keywords: ['tank top'], typeTokens: ['tank', 'top', 'bra', 'vest'], style: 'sleeveless' };
    if (/short/.test(n)) return { label: 'shorts', keywords: ['shorts'], typeTokens: ['shorts'], style: 'athletic' };
    if (/jacket|windrunner|track/.test(n)) return { label: 'jacket', keywords: ['jacket'], typeTokens: ['jacket', 'coat'], style: 'zip' };
    return { label: 't-shirt', keywords: ['t-shirt'], typeTokens: ['shirt', 't-shirt', 'tee', 'top'], style: 'crew' };
  }
  // gear
  if (/backpack/.test(n)) return { label: 'backpack', keywords: ['backpack'], typeTokens: ['backpack', 'bag', 'rucksack'], style: 'daypack' };
  if (/duffel|duffle/.test(n)) return { label: 'duffel bag', keywords: ['duffel bag', 'backpack'], typeTokens: ['duffel', 'bag', 'gym', 'holdall'], style: 'gym' };
  if (/tote/.test(n)) return { label: 'tote bag', keywords: ['tote bag', 'backpack'], typeTokens: ['tote', 'bag'], style: 'carry' };
  if (/cap|hat/.test(n)) return { label: 'cap', keywords: ['baseball cap'], typeTokens: ['cap', 'hat'], style: 'adjustable' };
  if (/beanie/.test(n)) return { label: 'beanie', keywords: ['beanie'], typeTokens: ['beanie', 'hat'], style: 'knit' };
  if (/glove/.test(n)) return { label: 'gloves', keywords: ['gloves'], typeTokens: ['glove'], style: 'grip' };
  if (/ball|basketball/.test(n)) return { label: 'basketball', keywords: ['basketball'], typeTokens: ['basketball', 'ball'], style: 'official' };
  if (/belt/.test(n)) return { label: 'belt bag', keywords: ['tote bag', 'backpack'], typeTokens: ['belt', 'bag', 'pouch'], style: 'waist' };
  return { label: 'bag', keywords: ['backpack', 'tote bag'], typeTokens: ['bag'], style: 'utility' };
}

function poolFor(keywords) {
  const seen = new Set();
  const out = [];
  for (const kw of keywords) for (const e of POOL[kw] || []) {
    if (!seen.has(e.url)) { seen.add(e.url); out.push(e); }
  }
  return out;
}

function matchTokens(entry, tokens) {
  const hay = `${entry.title} ${entry.tags.join(' ')}`;
  return tokens.some((t) => hay.includes(t));
}

/** Draw a globally-unique, type-validated pool image; prefer color match. */
function drawUnique(keywords, typeTokens, colorTokens) {
  const pool = poolFor(keywords);
  let pick =
    pool.find((e) => !usedImageUrls.has(e.url) && matchTokens(e, typeTokens) && matchTokens(e, colorTokens)) ||
    pool.find((e) => !usedImageUrls.has(e.url) && matchTokens(e, typeTokens));
  if (!pick) return null;
  usedImageUrls.add(pick.url);
  return { entry: pick, colorMatch: matchTokens(pick, colorTokens) };
}

function imageFromDraw(draw, angle, productName, colorName) {
  return {
    url: draw.entry.url,
    angle,
    alt: `${productName} in ${colorName} — ${angle} view`,
    width: 800,
    height: 1000,
    source: 'matched-stock',
    colorMatch: draw.colorMatch,
  };
}

/** Keyword-based fallback (relevant query, but returned tags are not
 *  verifiable at build time — flagged unverified per the directive). */
function loremflickrImage(resolver, colorName, angle, productName) {
  const kw = `${colorWord(colorName)},${resolver.label}`.replace(/\s+/g, ',');
  return {
    url: `https://loremflickr.com/800/1000/${encodeURIComponent(kw)}/all?lock=${lockCounter++}`,
    angle,
    alt: `${productName} in ${colorName} — ${angle} view`,
    width: 800,
    height: 1000,
    source: 'unverified',
    colorMatch: false,
  };
}

const LOCAL_PRIMARY = {
  'air-max-pulse': 'nike-air-max-pulse-01',
  'air-max-90': 'nike-air-max-90-02',
  'air-max-plus': 'nike-air-max-plus-03',
  'pegasus-premium': 'nike-pegasus-premium-04',
  'dri-fit-advance-top': 'nike-dri-fit-advance-05',
  'tech-fleece-jogger': 'nike-tech-fleece-jogger-06',
  'air-max-1': 'nike-air-max-1-07',
  'air-max-97': 'nike-air-max-97-08',
  'dunk-low': 'nike-dunk-low-09',
  'vomero-17': 'nike-vomero-17-10',
  'yoga-luxe-legging': 'nike-yoga-luxe-legging-11',
  'windrunner-jacket': 'nike-windrunner-jacket-12',
  'air-max-dn': 'nike-air-max-dn-13',
  'star-runner-4': 'nike-star-runner-14',
  'flex-runner-3': 'nike-flex-runner-15',
  'dri-fit-tee': 'nike-kids-dri-fit-tee-16',
  'club-fleece-hoodie': 'nike-kids-fleece-hoodie-17',
  'basketball-short': 'nike-kids-basketball-short-18',
  'heritage-backpack': 'nike-heritage-backpack-19',
  'brasilia-duffel': 'nike-brasilia-duffel-20',
  'swoosh-cap': 'nike-swoosh-cap-21',
  'gym-club-tote': 'nike-gym-club-tote-22',
  'running-belt': 'nike-running-belt-23',
  'pro-hyperwarm-beanie': 'nike-pro-beanie-24',
};

// Multi-brand vintage/resale catalogue. Each item: { b: brand, m: model, e: era? }.
// `brandLine` is retained as the department used by the line/filter pages.
// Pinned Nike/Jordan models (Air Max family, Dunk, Pegasus, etc.) keep their real
// brand so curated local imagery, legacy id aliases, and the hero carousel stay intact.
const TEMPLATES = [
  { category: 'Men', brandLine: 'Air Max', sub: 'shoes', basePrice: 130, items: [
    { b: 'Nike', m: 'Air Max Pulse', e: '00s' }, { b: 'Nike', m: 'Air Max 90', e: '90s' }, { b: 'Nike', m: 'Air Max Plus', e: 'Y2K' }, { b: 'Nike', m: 'Air Max 1', e: '90s' }, { b: 'Nike', m: 'Air Max 97', e: 'Y2K' }, { b: 'Nike', m: 'Air Max DN', e: '10s' }, { b: 'Nike', m: 'Air Max Portal', e: '10s' }, { b: 'Nike', m: 'Air Max Muse', e: '10s' } ] },
  { category: 'Men', brandLine: 'Running', sub: 'shoes', basePrice: 140, items: [
    { b: 'Nike', m: 'Pegasus Premium', e: '10s' }, { b: 'Nike', m: 'Vomero 17' }, { b: 'Adidas', m: 'Ultraboost 1.0', e: '10s' }, { b: 'ASICS', m: 'Gel-Kayano 14', e: '00s' }, { b: 'New Balance', m: '990v3', e: '00s' }, { b: 'Reebok', m: 'Floatride Energy' } ] },
  { category: 'Men', brandLine: 'Basketball', sub: 'shoes', basePrice: 110, items: [
    { b: 'Adidas', m: 'Crazy 8', e: '90s' }, { b: 'Reebok', m: 'Question Mid', e: '90s' }, { b: 'Puma', m: 'MB.01' }, { b: 'Nike', m: 'G.T. Cut 3' } ] },
  { category: 'Men', brandLine: 'Jordan', sub: 'shoes', basePrice: 120, items: [
    { b: 'Nike', m: 'Dunk Low', e: '00s' }, { b: 'Jordan', m: 'Jordan 1 Low', e: '10s' }, { b: 'Jordan', m: 'Jordan 4 Retro', e: '00s' }, { b: 'Jordan', m: 'Jordan Stadium 90' } ] },
  { category: 'Men', brandLine: 'Training', sub: 'shoes', basePrice: 130, items: [
    { b: 'Nike', m: 'Metcon 9' }, { b: 'Reebok', m: 'Nano X3' }, { b: 'Puma', m: 'Fuse 2.0' } ] },
  { category: 'Men', brandLine: 'Lifestyle', sub: 'shoes', basePrice: 95, items: [
    { b: 'Converse', m: 'Chuck 70 Hi', e: '90s' }, { b: 'Nike', m: 'Cortez', e: '90s' }, { b: 'New Balance', m: '550', e: '00s' }, { b: 'Puma', m: 'Suede Classic', e: '90s' } ] },
  { category: 'Men', brandLine: 'Running', sub: 'apparel', basePrice: 55, items: [
    { b: 'Nike', m: 'Dri-FIT ADV Top' }, { b: 'Patagonia', m: 'Houdini Jacket', e: '10s' }, { b: 'The North Face', m: 'Flight Series Short' }, { b: 'Patagonia', m: 'Trail Vest' } ] },
  { category: 'Men', brandLine: 'Training', sub: 'apparel', basePrice: 45, items: [
    { b: 'Nike', m: 'Tech Fleece Jogger' }, { b: 'Champion', m: 'Reverse Weave Short', e: '90s' }, { b: 'Carhartt', m: 'Midweight Hoodie' }, { b: 'Supreme', m: 'Box Logo Hoodie', e: '10s' } ] },
  { category: 'Men', brandLine: 'Lifestyle', sub: 'apparel', basePrice: 40, items: [
    { b: 'Champion', m: 'Reverse Weave Crew', e: '90s' }, { b: 'Ralph Lauren', m: 'Cotton Oxford Shirt', e: '00s' }, { b: 'Carhartt', m: 'Detroit Jacket', e: '90s' }, { b: 'Dickies', m: '874 Work Pant', e: '00s' } ] },
  { category: 'Women', brandLine: 'Air Max', sub: 'shoes', basePrice: 125, items: [
    { b: 'Nike', m: 'Air Max 1', e: '90s' }, { b: 'Nike', m: 'Air Max 90', e: '90s' }, { b: 'Nike', m: 'Air Max Dawn' }, { b: 'Nike', m: 'Air Max Bliss' } ] },
  { category: 'Women', brandLine: 'Running', sub: 'shoes', basePrice: 135, items: [
    { b: 'Nike', m: 'Vomero 17' }, { b: 'New Balance', m: 'FuelCell Rebel' }, { b: 'ASICS', m: 'GT-2000' }, { b: 'Adidas', m: 'Adizero SL' } ] },
  { category: 'Women', brandLine: 'Training', sub: 'shoes', basePrice: 100, items: [
    { b: 'Reebok', m: 'Nano X4' }, { b: 'Puma', m: 'Deviate Nitro' }, { b: 'Nike', m: 'Free TR 8' } ] },
  { category: 'Women', brandLine: 'Lifestyle', sub: 'shoes', basePrice: 105, items: [
    { b: 'Nike', m: 'Dunk Low' }, { b: 'Converse', m: 'Chuck Taylor Lo', e: '90s' }, { b: 'New Balance', m: '327', e: '00s' }, { b: 'Puma', m: 'Palermo', e: '90s' } ] },
  { category: 'Women', brandLine: 'Basketball', sub: 'shoes', basePrice: 125, items: [
    { b: 'Nike', m: 'Sabrina 2' }, { b: 'Adidas', m: 'Exhibit Select' } ] },
  { category: 'Women', brandLine: 'Training', sub: 'apparel', basePrice: 48, items: [
    { b: 'Nike', m: 'Yoga Luxe Legging' }, { b: 'Adidas', m: 'Ribbed Tank' }, { b: 'Champion', m: 'Sport Bra' }, { b: 'Reebok', m: 'Lux Tight' } ] },
  { category: 'Women', brandLine: 'Running', sub: 'apparel', basePrice: 42, items: [
    { b: 'Nike', m: 'Windrunner Jacket', e: '90s' }, { b: 'Patagonia', m: 'Nine Trails Short' }, { b: 'The North Face', m: 'Running Crop' }, { b: 'Adidas', m: 'Fast Crop' } ] },
  { category: 'Women', brandLine: 'Lifestyle', sub: 'apparel', basePrice: 55, items: [
    { b: 'Ralph Lauren', m: 'Wool Cardigan', e: '90s' }, { b: "Levi's", m: 'Wide-Leg Jean', e: '90s' }, { b: 'The North Face', m: 'Nuptse Jacket', e: '00s' }, { b: 'Stussy', m: 'Knit Bodysuit' } ] },
  { category: 'Kids', brandLine: 'Running', sub: 'shoes', basePrice: 55, items: [
    { b: 'Nike', m: 'Star Runner 4' }, { b: 'Nike', m: 'Flex Runner 3' }, { b: 'Adidas', m: 'Duramo Kids' }, { b: 'New Balance', m: '570 Kids' } ] },
  { category: 'Kids', brandLine: 'Basketball', sub: 'shoes', basePrice: 60, items: [
    { b: 'Nike', m: 'Team Hustle D 11' }, { b: 'Adidas', m: 'Cross Em Up' } ] },
  { category: 'Kids', brandLine: 'Air Max', sub: 'shoes', basePrice: 95, items: [
    { b: 'Nike', m: 'Air Max DN' }, { b: 'Nike', m: 'Air Max SC' }, { b: 'Nike', m: 'Air Max Excee' } ] },
  { category: 'Kids', brandLine: 'Training', sub: 'apparel', basePrice: 26, items: [
    { b: 'Nike', m: 'Basketball Short' }, { b: 'Champion', m: 'Kids Logo Short' }, { b: 'Adidas', m: 'Woven Short' }, { b: 'Nike', m: 'Dri-FIT Tee' } ] },
  { category: 'Kids', brandLine: 'Lifestyle', sub: 'apparel', basePrice: 38, items: [
    { b: 'Nike', m: 'Club Fleece Hoodie' }, { b: 'Carhartt', m: 'Kids Canvas Pant' }, { b: 'Champion', m: 'Fleece Jogger' } ] },
  { category: 'Accessories', brandLine: 'Lifestyle', sub: 'gear', basePrice: 38, items: [
    { b: 'Nike', m: 'Heritage Backpack' }, { b: 'Nike', m: 'Brasilia Duffel' }, { b: 'Nike', m: 'Gym Club Tote' }, { b: 'Carhartt', m: 'Canvas Backpack' } ] },
  { category: 'Accessories', brandLine: 'Running', sub: 'gear', basePrice: 28, items: [
    { b: 'Nike', m: 'Running Belt' }, { b: 'Patagonia', m: 'Hydration Flask Vest' }, { b: 'The North Face', m: 'Reflective Arm Band' } ] },
  { category: 'Accessories', brandLine: 'Training', sub: 'gear', basePrice: 22, items: [
    { b: 'Nike', m: 'Pro Hyperwarm Beanie' }, { b: 'Nike', m: 'Heritage Cap' }, { b: 'Champion', m: 'Training Gloves' }, { b: 'Reebok', m: 'Resistance Band Pack' } ] },
  { category: 'Accessories', brandLine: 'Basketball', sub: 'gear', basePrice: 32, items: [
    { b: 'Nike', m: 'Hoops Elite Backpack' }, { b: 'Champion', m: 'Court Towel' }, { b: 'Nike', m: 'Elite Basketball' } ] },
];

const CONDITIONS = ['Like New', 'Excellent', 'Good', 'Fair'];
const CONDITION_NOTE = {
  'Like New': 'barely worn, with no notable flaws',
  Excellent: 'lightly worn, with only the faintest signs of use',
  Good: 'gently worn, with honest, minor signs of wear',
  Fair: 'well-loved and full of character, with visible wear',
};
function pickCondition(i) {
  const r = i % 10;
  if (r < 3) return 'Like New';
  if (r < 7) return 'Excellent';
  if (r < 9) return 'Good';
  return 'Fair';
}

const COLOR_PALETTES = [
  { name: 'Black', hex: '#111111' },
  { name: 'White', hex: '#F5F5F5' },
  { name: 'Photon Dust', hex: '#C8C8C8' },
  { name: 'Midnight Navy', hex: '#1B2A41' },
  { name: 'University Red', hex: '#C8102E' },
  { name: 'Volt', hex: '#CEFF00' },
  { name: 'Olive Aura', hex: '#5C6B4A' },
  { name: 'Rose Whisper', hex: '#E8C4C4' },
  { name: 'Hyper Pink', hex: '#FF006E' },
  { name: 'Ironstone', hex: '#434343' },
];

const SHOE_SIZES_MEN = ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '12'];
const SHOE_SIZES_WOMEN = ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '10'];
const SHOE_SIZES_KIDS = ['10.5', '11', '12', '13', '1', '2', '3', '4', '5'];
const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const ONE_SIZE = ['One Size'];

let productCounter = 0;
const allProducts = [];
const pendingColors = [];
const slugSet = new Set();
const nameSet = new Set();

const CATEGORY_QUALIFIER = { Men: "Men's", Women: "Women's", Kids: "Kids'", Accessories: 'Accessories' };

const USE_CASE = {
  'Air Max': 'Visible Max Air cushioning delivers all-day comfort with heritage street style.',
  Running: 'Responsive foam and a breathable upper keep you light and locked in through every mile.',
  Basketball: 'Court-ready traction and lockdown support built for explosive play.',
  Jordan: 'Iconic hoops heritage meets modern materials for everyday wear.',
  Training: 'Stable, flexible, and durable for lifting, HIIT, and studio sessions.',
  Lifestyle: 'A timeless silhouette finished with premium materials for daily rotation.',
};

const MATERIAL_BY_SUB = {
  shoes: 'engineered mesh and synthetic overlays',
  apparel: 'moisture-wicking Dri-FIT fabric',
  gear: 'durable water-resistant textile',
};

function buildDescription({ brand, model, tpl, primaryColor, condition, era, sku }) {
  const audience =
    tpl.category === 'Men' ? "men's" : tpl.category === 'Women' ? "women's" : tpl.category === 'Kids' ? "kids'" : 'unisex';
  const noun = tpl.sub === 'shoes' ? 'pair' : tpl.sub === 'apparel' ? 'piece' : 'piece';
  const eraBit = era ? `${era} ` : '';
  const lede = era
    ? `A ${eraBit}${brand} ${model} in ${primaryColor} — sourced, inspected, and authenticated for the ARCHIVE.`
    : `A ${brand} ${model} in ${primaryColor} — sourced, inspected, and authenticated for the ARCHIVE.`;
  return `${lede} This ${audience} ${noun} is graded ${condition}: ${CONDITION_NOTE[condition]}. A single unit, photographed exactly as it is and ready for its next chapter. Ref ${sku}.`;
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Single-unit resale: a piece is either available or sold.
function pickInventory(index) {
  if (index < 3) return 'in_stock';
  return index % 13 === 0 ? 'out_of_stock' : 'in_stock';
}

// Vintage listings are one physical unit — a single size, quantity one.
function pickSingleSize(category, sub, index) {
  if (sub === 'gear') return 'One Size';
  if (sub === 'apparel') return APPAREL_SIZES[index % APPAREL_SIZES.length];
  const run = category === 'Men' ? SHOE_SIZES_MEN : category === 'Women' ? SHOE_SIZES_WOMEN : SHOE_SIZES_KIDS;
  return run[index % run.length];
}

function buildSizes(category, sub, inventory, index) {
  return [{ value: pickSingleSize(category, sub, index), inStock: inventory !== 'out_of_stock' }];
}

function pickColorObjs(count) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    const palette = COLOR_PALETTES[(productCounter + i) % COLOR_PALETTES.length];
    arr.push({ name: palette.name, hex: palette.hex });
  }
  return arr;
}

/** Product gallery: unique, type-validated pool images (local curated primary
 *  where available; keyword fallback flagged unverified if the pool is dry). */
function buildGallery(slug, productName, resolver, primaryColorName) {
  const localKey = Object.keys(LOCAL_PRIMARY).find((k) => slug === k);
  const images = [];
  for (let i = 0; i < 4; i++) {
    const angle = ANGLES[i];
    if (i === 0 && localKey) {
      images.push({
        url: `assets/products/${LOCAL_PRIMARY[localKey]}.jpg`,
        angle,
        alt: `${productName} in ${primaryColorName} — ${angle} view`,
        width: 800,
        height: 1000,
        source: 'curated',
        colorMatch: true,
      });
      continue;
    }
    const draw = drawUnique(resolver.keywords, resolver.typeTokens, colorTokensFor(primaryColorName));
    images.push(draw ? imageFromDraw(draw, angle, productName, primaryColorName) : loremflickrImage(resolver, primaryColorName, angle, productName));
  }
  return images;
}

/** Per-color images: unique type-validated pool images preferred; when the
 *  pool for this type is exhausted, reuse this product's own gallery images
 *  (within-product reuse keeps cross-product uniqueness intact). */
function buildColorImages(resolver, colorName, gallery, productName, count) {
  const images = [];
  for (let i = 0; i < count; i++) {
    const angle = ANGLES[i % ANGLES.length];
    const draw = drawUnique(resolver.keywords, resolver.typeTokens, colorTokensFor(colorName));
    if (draw) {
      images.push(imageFromDraw(draw, angle, productName, colorName));
    } else {
      const g = gallery[i % gallery.length];
      images.push({ ...g, angle, alt: `${productName} in ${colorName} — ${angle} view` });
    }
  }
  return images;
}

function productImageSource(gallery) {
  const primary = gallery[0];
  if (primary.source === 'curated') return 'curated';
  if (primary.source === 'matched-stock') return 'matched-stock';
  return 'unverified';
}

function buildReviews(productId, productName, count) {
  const reviews = [];
  for (let i = 0; i < count; i++) {
    reviews.push({
      id: `${productId}-review-${i + 1}`,
      author: ['Alex M.', 'Jordan K.', 'Sam R.', 'Taylor P.'][i % 4],
      rating: i % 3 === 0 ? 5 : 4,
      title: ['Great fit', 'Exceeded expectations', 'Solid daily driver'][i % 3],
      body: `${productName} delivers comfort and performance for everyday wear.`,
      date: `2026-0${(i % 6) + 1}-15`,
      verifiedPurchase: i % 2 === 0,
    });
  }
  return reviews;
}

function ratingFromReviews(reviews) {
  if (!reviews.length) return { average: 0, count: 0 };
  const sum = reviews.reduce((a, r) => a + r.rating, 0);
  return { average: Math.round((sum / reviews.length) * 10) / 10, count: reviews.length };
}

for (const tpl of TEMPLATES) {
  for (const item of tpl.items) {
    if (allProducts.length >= 100) break;
    const brand = item.b;
    const model = item.m;
    const era = item.e || null;
    const baseSlug = slugify(model);
    let slug = baseSlug;
    let n = 2;
    while (slugSet.has(slug)) slug = `${baseSlug}-${n++}`;
    slugSet.add(slug);

    const id = `archive-${slug}`;
    const inventory = pickInventory(productCounter);
    const condition = pickCondition(productCounter);
    const authenticated = true;
    const isNew = productCounter % 9 === 0;
    const isBestSeller = productCounter % 6 === 0;
    const onSale = productCounter % 8 === 0;
    const isTrending = productCounter % 4 === 0;
    const isFeatured = productCounter % 5 === 0;
    const basePrice = tpl.basePrice + (productCounter % 5) * 5;
    const price = onSale ? Math.round(basePrice * 0.78) : basePrice;
    const compareAtPrice = onSale ? basePrice : undefined;

    let productName = `${brand} ${model}`;
    if (nameSet.has(productName)) {
      productName = `${brand} ${model} ${CATEGORY_QUALIFIER[tpl.category] || tpl.category}`;
    }
    while (nameSet.has(productName)) productName = `${brand} ${model} ${CATEGORY_QUALIFIER[tpl.category] || tpl.category} ${productCounter}`;
    nameSet.add(productName);

    const resolver = resolveType(tpl, model);
    const colorObjs = pickColorObjs(2 + (productCounter % 2));
    const images = buildGallery(slug, productName, resolver, colorObjs[0].name);
    const colors = colorObjs.map((c) => ({ name: c.name, hex: c.hex, images: [] }));
    const imageSource = productImageSource(images);
    const reviewCount = isBestSeller ? 3 : productCounter % 4 === 0 ? 2 : 0;
    const sku = `AR-${String(productCounter + 1).padStart(4, '0')}`;

    const tags = [tpl.sub, tpl.brandLine.toLowerCase().replace(/\s/g, '-'), brand.toLowerCase().replace(/[^a-z0-9]+/g, '-')];
    if (era) tags.push(era.toLowerCase());
    if (isNew) tags.push('new');
    if (isBestSeller) tags.push('bestseller');
    if (onSale) tags.push('sale');
    if (isFeatured) tags.push('featured');
    if (isTrending) tags.push('trending');

    allProducts.push({
      id,
      sku,
      slug,
      name: productName,
      brand,
      condition,
      era,
      authenticated,
      brandLine: tpl.brandLine,
      category: tpl.category,
      subcategory: tpl.sub,
      price,
      compareAtPrice,
      currency: 'USD',
      description: buildDescription({ brand, model, tpl, primaryColor: colors[0].name, condition, era, sku }),
      features: ['Authenticated by ARCHIVE specialists', `Condition graded ${condition}`, 'Single unit — one size, one piece', 'Photographed as-is, no retouching'],
      specifications: { Brand: brand, Condition: condition, Era: era || 'Modern', Ref: sku },
      sizes: buildSizes(tpl.category, tpl.sub, inventory, productCounter),
      colors,
      images,
      rating: ratingFromReviews(buildReviews(id, productName, reviewCount)),
      reviews: buildReviews(id, productName, reviewCount),
      shippingInfo: 'Free standard shipping on orders over $50. Each piece is inspected once more before it ships.',
      returnPolicy: 'As-described guarantee: returns accepted within 14 days if the item arrives materially not as described.',
      relatedProductIds: [],
      recommendedProductIds: [],
      collectionIds: [],
      tags,
      isNew,
      isBestSeller,
      isTrending,
      isFeatured,
      isOnSale: onSale,
      imageSource,
      inventoryStatus: inventory,
      createdAt: `2026-0${(productCounter % 6) + 1}-${String((productCounter % 27) + 1).padStart(2, '0')}`,
    });
    pendingColors.push({ product: allProducts[allProducts.length - 1], resolver, colorObjs });
    productCounter++;
  }
}

while (allProducts.length < 100) {
  const i = allProducts.length;
  const tpl = TEMPLATES[i % TEMPLATES.length];
  const seed = tpl.items[0];
  const brand = seed.b;
  const model = `${seed.m} Edition ${i}`;
  const era = seed.e || null;
  const baseSlug = slugify(model);
  let slug = baseSlug;
  let n = 2;
  while (slugSet.has(slug)) slug = `${baseSlug}-${n++}`;
  slugSet.add(slug);
  const id = `archive-${slug}`;
  const condition = pickCondition(i);
  let productName = `${brand} ${model}`;
  while (nameSet.has(productName)) productName = `${brand} ${model}-${n++}`;
  nameSet.add(productName);
  const sku = `AR-${String(i + 1).padStart(4, '0')}`;
  const resolver = resolveType(tpl, seed.m);
  const colorObjs = pickColorObjs(2);
  const images = buildGallery(slug, productName, resolver, colorObjs[0].name);
  const colors = colorObjs.map((c) => ({ name: c.name, hex: c.hex, images: [] }));
  allProducts.push({
    id,
    sku,
    slug,
    name: productName,
    brand,
    condition,
    era,
    authenticated: true,
    brandLine: tpl.brandLine,
    category: tpl.category,
    subcategory: tpl.sub,
    price: 79 + (i % 10) * 7,
    currency: 'USD',
    description: buildDescription({ brand, model, tpl, primaryColor: colors[0].name, condition, era, sku }),
    features: ['Authenticated by ARCHIVE specialists', `Condition graded ${condition}`, 'Single unit — one size, one piece'],
    specifications: { Brand: brand, Condition: condition, Era: era || 'Modern', Ref: sku },
    sizes: buildSizes(tpl.category, tpl.sub, 'in_stock', i),
    colors,
    images,
    rating: { average: 4.2, count: 1 },
    reviews: buildReviews(id, productName, 1),
    shippingInfo: 'Free standard shipping on orders over $50.',
    returnPolicy: 'As-described guarantee: returns accepted within 14 days if not as described.',
    relatedProductIds: [],
    recommendedProductIds: [],
    collectionIds: [],
    tags: [tpl.sub, tpl.brandLine.toLowerCase().replace(/\s/g, '-'), brand.toLowerCase().replace(/[^a-z0-9]+/g, '-')],
    isNew: false,
    isBestSeller: false,
    isTrending: false,
    isFeatured: false,
    isOnSale: false,
    imageSource: productImageSource(images),
    inventoryStatus: 'in_stock',
    createdAt: '2026-03-01',
  });
  pendingColors.push({ product: allProducts[allProducts.length - 1], resolver, colorObjs });
}

// Second pass: fill per-color images only after every product's gallery has
// claimed its share of the type pool, so primaries win first pick.
for (const pc of pendingColors) {
  pc.product.colors = pc.colorObjs.map((c) => ({
    name: c.name,
    hex: c.hex,
    images: buildColorImages(pc.resolver, c.name, pc.product.images, pc.product.name, 3),
  }));
}

allProducts.forEach((p) => {
  p.relatedProductIds = allProducts.filter((x) => x.brandLine === p.brandLine && x.id !== p.id).slice(0, 4).map((x) => x.id);
  p.recommendedProductIds = allProducts.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4).map((x) => x.id);
});

// Collection membership (mirrors js/site-config.js COLLECTIONS). Stamp each
// product with the collections it belongs to so collectionIds is a real field.
const COLLECTION_MEMBERS = {
  'city-uniform': ['archive-air-max-pulse', 'archive-air-max-90', 'archive-dunk-low', 'archive-tech-fleece-jogger'],
  'the-distance': ['archive-pegasus-premium', 'archive-vomero-17', 'archive-dri-fit-adv-top', 'archive-running-belt'],
  'hardwood': ['archive-dunk-low', 'archive-basketball-short', 'archive-brasilia-duffel', 'archive-star-runner-4'],
  'the-air-index': ['archive-air-max-dn', 'archive-air-max-97', 'archive-air-max-plus', 'archive-air-max-1'],
};
for (const [collectionId, ids] of Object.entries(COLLECTION_MEMBERS)) {
  for (const id of ids) {
    const prod = allProducts.find((p) => p.id === id);
    if (prod && !prod.collectionIds.includes(collectionId)) prod.collectionIds.push(collectionId);
  }
}
const unresolved = Object.entries(COLLECTION_MEMBERS).flatMap(([, ids]) =>
  ids.filter((id) => !allProducts.some((p) => p.id === id))
);
if (unresolved.length) console.warn('Unresolved collection ids:', unresolved);

const LEGACY_MAP = {
  'nike-air-max-pulse-01': 'air-max-pulse',
  'nike-air-max-90-02': 'air-max-90',
  'nike-air-max-plus-03': 'air-max-plus',
  'nike-pegasus-premium-04': 'pegasus-premium',
  'nike-dri-fit-advance-05': 'dri-fit-advance-top',
  'nike-tech-fleece-jogger-06': 'tech-fleece-jogger',
  'nike-air-max-1-07': 'air-max-1',
  'nike-air-max-97-08': 'air-max-97',
  'nike-dunk-low-09': 'dunk-low',
  'nike-vomero-17-10': 'vomero-17',
  'nike-yoga-luxe-legging-11': 'yoga-luxe-legging',
  'nike-windrunner-jacket-12': 'windrunner-jacket',
  'nike-air-max-dn-13': 'air-max-dn',
  'nike-star-runner-14': 'star-runner-4',
  'nike-flex-runner-15': 'flex-runner-3',
  'nike-kids-dri-fit-tee-16': 'dri-fit-tee',
  'nike-kids-fleece-hoodie-17': 'club-fleece-hoodie',
  'nike-kids-basketball-short-18': 'basketball-short',
  'nike-heritage-backpack-19': 'heritage-backpack',
  'nike-brasilia-duffel-20': 'brasilia-duffel',
  'nike-swoosh-cap-21': 'swoosh-cap',
  'nike-gym-club-tote-22': 'gym-club-tote',
  'nike-running-belt-23': 'running-belt',
  'nike-pro-beanie-24': 'pro-hyperwarm-beanie',
};

const legacyAliases = {};
for (const [legacyId, slug] of Object.entries(LEGACY_MAP)) {
  const target = allProducts.find((p) => p.slug === slug);
  if (target) legacyAliases[legacyId] = target.id;
}

const output = `/** AUTO-GENERATED — node scripts/generate-catalog.js */\n(function(){'use strict';window.__PRODUCTS_CATALOG__=${JSON.stringify(allProducts)};window.__PRODUCTS_LEGACY_ALIASES__=${JSON.stringify(legacyAliases)};})();\n`;
fs.writeFileSync(OUT, output);
console.log('Products:', allProducts.length);
console.log('Inventory:', INVENTORY.map((s) => `${s}:${allProducts.filter((p) => p.inventoryStatus === s).length}`).join(', '));
console.log('On sale:', allProducts.filter((p) => p.isOnSale).length);
console.log('New:', allProducts.filter((p) => p.isNew).length, 'BestSeller:', allProducts.filter((p) => p.isBestSeller).length, 'Trending:', allProducts.filter((p) => p.isTrending).length, 'Featured:', allProducts.filter((p) => p.isFeatured).length);
console.log('Unique names:', new Set(allProducts.map((p) => p.name)).size, '/ Unique descriptions:', new Set(allProducts.map((p) => p.description)).size);
const brandBuckets = allProducts.reduce((acc, p) => { acc[p.brand] = (acc[p.brand] || 0) + 1; return acc; }, {});
console.log('Brands:', Object.keys(brandBuckets).length, JSON.stringify(brandBuckets));
const condBuckets = allProducts.reduce((acc, p) => { acc[p.condition] = (acc[p.condition] || 0) + 1; return acc; }, {});
console.log('Condition:', JSON.stringify(condBuckets), '| authenticated:', allProducts.filter((p) => p.authenticated).length, '| with era:', allProducts.filter((p) => p.era).length);

const srcBuckets = allProducts.reduce((acc, p) => { acc[p.imageSource] = (acc[p.imageSource] || 0) + 1; return acc; }, {});
console.log('imageSource (product primary):', JSON.stringify(srcBuckets));
const allImgs = allProducts.flatMap((p) => [...p.images, ...p.colors.flatMap((c) => c.images)]);
const imgSrc = allImgs.reduce((acc, im) => { acc[im.source] = (acc[im.source] || 0) + 1; return acc; }, {});
const distinct = new Set(allImgs.map((im) => im.url));
console.log('image slots by source:', JSON.stringify(imgSrc), '| distinct URLs:', distinct.size, '/', allImgs.length);
