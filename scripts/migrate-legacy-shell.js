const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const SHELL_BEFORE_PRODUCTS = `<script src="js/site-config.js"></script>
  <script src="js/products-data.js"></script>
  <script src="js/wishlist-engine.js"></script>`;

const SHELL_BEFORE_PAGES = `<script src="js/site-shell.js"></script>
  <script src="js/pages.js"></script>`;

const QUICK_VIEW = `  <script src="js/quick-view.js"></script>`;

const legacyShop = [
  'shop.html',
  'shop-men.html',
  'shop-women.html',
  'shop-kids.html',
  'shop-accessories.html',
];

function migrateFile(file) {
  const filePath = path.join(root, file);
  if (!fs.existsSync(filePath)) return;

  let html = fs.readFileSync(filePath, 'utf8');
  if (html.includes('site-shell.js')) {
    console.log('Skip (already migrated):', file);
    return;
  }

  html = html.replace(
    '<script src="js/products-data.js"></script>',
    SHELL_BEFORE_PRODUCTS
  );

  html = html.replace(
    '<script src="js/pages.js"></script>',
    SHELL_BEFORE_PAGES
  );

  if (legacyShop.includes(file) && !html.includes('quick-view.js')) {
    html = html.replace(
      /(<script src="js\/shop-renderer\.js"><\/script>)/,
      `$1\n${QUICK_VIEW}`
    );
    html = html.replace(
      /(<script src="js\/shop-render\.js"><\/script>)/,
      `$1\n${QUICK_VIEW}`
    );
  }

  fs.writeFileSync(filePath, html);
  console.log('Migrated:', file);
}

['cart.html', 'support.html', 'product.html', ...legacyShop].forEach(migrateFile);

const indexPath = path.join(root, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

if (!indexHtml.includes('data-shell="home"')) {
  indexHtml = indexHtml.replace('<body>', '<body data-shell="home">');
}

if (!indexHtml.includes('site-footer-mount')) {
  indexHtml = indexHtml.replace(
    /<!-- Footer -->[\s\S]*?<\/footer>/,
    '<div id="site-footer-mount"></div>'
  );
}

if (!indexHtml.includes('site-config.js')) {
  indexHtml = indexHtml.replace(
    '<script src="js/products-data.js"></script>',
    `<script src="js/site-config.js"></script>
  <script src="js/products-data.js"></script>
  <script src="js/wishlist-engine.js"></script>`
  );
  indexHtml = indexHtml.replace(
    '<script src="js/cart-drawer.js"></script>',
    `<script src="js/cart-drawer.js"></script>
  <script src="js/site-shell.js"></script>`
  );
}

fs.writeFileSync(indexPath, indexHtml);
console.log('Migrated: index.html');
