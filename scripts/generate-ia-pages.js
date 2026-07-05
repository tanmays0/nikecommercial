const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const scripts = `
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js"></script>
  <script src="js/site-config.js"></script>
  <script src="js/products-data.js"></script>
  <script src="js/wishlist-engine.js"></script>
  <script src="js/cart-engine.js"></script>
  <script src="js/cart-ui.js"></script>
  <script src="js/cart-drawer.js"></script>
  <script src="js/site-shell.js"></script>
  <script src="js/pages.js"></script>`;

function page(title, desc, bodyAttrs, main, extra = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${desc}">
  <meta name="theme-color" content="#181510">
  <title>${title}</title>
  <link rel="icon" href="favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="apple-touch-icon.svg">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400&display=swap" rel="stylesheet">
  <link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body class="page-inner"${bodyAttrs ? ' ' + bodyAttrs : ''}>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div id="site-header-mount"></div>
  <main id="main-content">
${main}
  </main>
  <div id="site-footer-mount"></div>${scripts}
${extra}
</body>
</html>`;
}

const pages = {
  'about.html': page('About — ARCHIVE', 'About us', 'data-content="about"', '    <div class="container content-page-wrap" id="content-main"></div>', '  <script src="js/content-page.js"></script>'),
  'contact.html': page('Contact — ARCHIVE', 'Contact', 'data-content="contact"', '    <div class="container content-page-wrap" id="content-main"></div>', '  <script src="js/content-page.js"></script>'),
  'faqs.html': page('FAQs — ARCHIVE', 'FAQs', 'data-content="faqs"', '    <div class="container content-page-wrap" id="content-main"></div>', '  <script src="js/content-page.js"></script>'),
  'shipping-info.html': page('Shipping — ARCHIVE', 'Shipping', 'data-content="shipping-info"', '    <div class="container content-page-wrap" id="content-main"></div>', '  <script src="js/content-page.js"></script>'),
  'returns-policy.html': page('Returns — ARCHIVE', 'Returns', 'data-content="returns-policy"', '    <div class="container content-page-wrap" id="content-main"></div>', '  <script src="js/content-page.js"></script>'),
  'privacy-policy.html': page('Privacy — ARCHIVE', 'Privacy', 'data-content="privacy-policy"', '    <div class="container content-page-wrap" id="content-main"></div>', '  <script src="js/content-page.js"></script>'),
  'terms-of-service.html': page('Terms — ARCHIVE', 'Terms', 'data-content="terms-of-service"', '    <div class="container content-page-wrap" id="content-main"></div>', '  <script src="js/content-page.js"></script>'),
  'gift-cards.html': page('Gift Cards — ARCHIVE', 'Gift cards', 'data-content="gift-cards"', '    <div class="container content-page-wrap" id="content-main"></div>', '  <script src="js/content-page.js"></script>'),
  'sustainability.html': page('Sustainability — ARCHIVE', 'Sustainability', 'data-content="sustainability"', '    <div class="container content-page-wrap" id="content-main"></div>', '  <script src="js/content-page.js"></script>'),
  'careers.html': page('Careers — ARCHIVE', 'Careers', 'data-content="careers"', '    <div class="container content-page-wrap" id="content-main"></div>', '  <script src="js/content-page.js"></script>'),
  'accessibility.html': page('Accessibility — ARCHIVE', 'Accessibility', 'data-content="accessibility"', '    <div class="container content-page-wrap" id="content-main"></div>', '  <script src="js/content-page.js"></script>'),
  'size-guide.html': page('Size Guide — ARCHIVE', 'Size guide', 'data-content="size-guide"', '    <div class="container content-page-wrap" id="content-main"></div>', '  <script src="js/content-page.js"></script>'),
  'search.html': page('Search — ARCHIVE', 'Search products', '', `    <div class="page-hero"><div class="container"><p class="eyebrow">Discovery</p><h1 class="page-hero__title">SEARCH</h1></div></div>
    <div class="container search-page">
      <label class="search-page__field"><span class="visually-hidden">Search</span><input type="search" id="search-input" placeholder="Search shoes, apparel, gear…" autocomplete="off"></label>
      <p class="search-page__count" id="search-count" aria-live="polite"></p>
      <div id="search-results" class="search-page__results"></div>
      <div id="search-empty" class="shop-empty" hidden><p>No results found.</p><a href="shop.html" class="btn btn--pill">Browse All</a></div>
    </div>`, '  <script src="js/search-page.js"></script>'),
  'store-locator.html': page('Store Locator — ARCHIVE', 'Find stores', 'data-account="store-locator"', `    <div class="page-hero"><div class="container"><p class="eyebrow">Discovery</p><h1 class="page-hero__title">STORE LOCATOR</h1></div></div>
    <div class="container stores-grid" id="store-list"></div>`, '  <script src="js/account-page.js"></script>'),
  'collections.html': page('Collections — ARCHIVE', 'Collections', '', `    <div class="page-hero"><div class="container"><p class="eyebrow">Editorial</p><h1 class="page-hero__title">COLLECTIONS</h1></div></div>
    <div class="container collections-grid" id="collections-list"></div>`, '  <script src="js/collection-page.js"></script>'),
  'collection.html': page('Collection — ARCHIVE', 'Collection', '', `    <div id="collection-hero"></div>
    <div class="container shop-grid" id="collection-grid" role="list"></div>`, '  <script src="js/collection-page.js"></script>'),
  'wishlist.html': page('Wishlist — ARCHIVE', 'Wishlist', '', `    <div class="page-hero"><div class="container"><p class="eyebrow">Account</p><h1 class="page-hero__title">WISHLIST</h1></div></div>
    <div class="container"><div id="wishlist-empty" class="shop-empty"><p>Your wishlist is empty.</p><a href="shop.html" class="btn btn--pill">Shop Now</a></div><div class="shop-grid" id="wishlist-grid"></div></div>`, '  <script src="js/discovery-page.js"></script>'),
  'recently-viewed.html': page('Recently Viewed — ARCHIVE', 'Recently viewed', '', `    <div class="page-hero"><div class="container"><p class="eyebrow">Discovery</p><h1 class="page-hero__title">RECENTLY VIEWED</h1></div></div>
    <div class="container"><div id="recent-empty" class="shop-empty"><p>No recently viewed items.</p><a href="shop.html" class="btn btn--pill">Start Shopping</a></div><div class="shop-grid" id="recent-grid"></div></div>`, '  <script src="js/discovery-page.js"></script>'),
  'compare.html': page('Compare — ARCHIVE', 'Compare products', '', `    <div class="page-hero"><div class="container"><p class="eyebrow">Product</p><h1 class="page-hero__title">COMPARE</h1><p class="page-hero__lead">Use compare.html?ids=product-id-1,product-id-2</p></div></div>
    <div class="container"><div id="compare-empty" class="shop-empty"><p>No products to compare.</p></div><div id="compare-grid"></div></div>`, '  <script src="js/discovery-page.js"></script>'),
  'checkout.html': page('Checkout — ARCHIVE', 'Checkout', '', `    <div class="container checkout-page">
      <h1 class="checkout-page__title">Checkout</h1>
      <ol class="checkout-steps"><li data-checkout-step="1" class="is-active">Shipping</li><li data-checkout-step="2">Payment</li><li data-checkout-step="3">Review</li></ol>
      <div class="checkout-layout">
        <form id="checkout-form" class="checkout-form">
          <div data-checkout-panel="1"><h2>Shipping</h2><label class="form-field"><span>Full Name</span><input name="name" required></label><label class="form-field"><span>Address</span><input name="address" required></label><button type="button" class="btn btn--pill" data-checkout-next>Continue</button></div>
          <div data-checkout-panel="2" hidden><h2>Payment</h2><label class="form-field"><span>Card</span><input name="card" placeholder="4242 4242 4242 4242" required></label><button type="button" class="btn btn--pill btn--outline" data-checkout-back>Back</button><button type="button" class="btn btn--pill" data-checkout-next>Review</button></div>
          <div data-checkout-panel="3" hidden><h2>Review</h2><p>Mock payment — no charge.</p><button type="button" class="btn btn--pill btn--outline" data-checkout-back>Back</button><button type="submit" class="btn btn--pill">Place Order</button></div>
        </form>
        <aside id="checkout-summary" class="checkout-summary"></aside>
      </div>
    </div>`, '  <script src="js/checkout-page.js"></script>'),
  'order-confirmation.html': page('Order Confirmed', 'Confirmation', 'data-account="order-confirmation"', `    <div class="container content-page"><p class="eyebrow">Success</p><h1 class="content-page__title">Thank You</h1><p class="content-page__lead">Order <strong id="confirmation-id"></strong> confirmed.</p><a href="order-tracking.html" class="btn btn--pill">Track Order</a></div>`, '  <script src="js/account-page.js"></script>'),
  'orders.html': page('Orders', 'Order history', 'data-account="orders"', `    <div class="container account-page"><h1 class="account-page__title">Order History</h1><div id="orders-empty" class="shop-empty"><p>No orders yet.</p></div><div id="orders-list" class="orders-list"></div></div>`, '  <script src="js/account-page.js"></script>'),
  'order-detail.html': page('Order Detail', 'Order', 'data-account="order-detail"', '    <div class="container account-page" id="order-detail"></div>', '  <script src="js/account-page.js"></script>'),
  'order-tracking.html': page('Track Order', 'Tracking', 'data-account="order-tracking"', `    <div class="container account-page"><h1 class="account-page__title">Track Order</h1><form id="tracking-form" class="account-form"><label class="form-field"><span>Order ID</span><input name="orderId" required></label><button type="submit" class="btn btn--pill">Track</button></form><div id="tracking-result"></div></div>`, '  <script src="js/account-page.js"></script>'),
  'login.html': page('Sign In', 'Login', 'data-account="login"', `    <div class="container account-page"><h1 class="account-page__title">Sign In</h1><form id="account-form" class="account-form"><label class="form-field"><span>Email</span><input type="email" name="email" required></label><button type="submit" class="btn btn--pill">Sign In</button></form><p><a href="register.html">Register</a> · <a href="forgot-password.html">Forgot password?</a></p></div>`, '  <script src="js/account-page.js"></script>'),
  'register.html': page('Register', 'Register', 'data-account="register"', `    <div class="container account-page"><h1 class="account-page__title">Create Account</h1><form id="account-form" class="account-form"><label class="form-field"><span>Name</span><input name="name" required></label><label class="form-field"><span>Email</span><input type="email" name="email" required></label><button type="submit" class="btn btn--pill">Register</button></form></div>`, '  <script src="js/account-page.js"></script>'),
  'forgot-password.html': page('Forgot Password', 'Reset', 'data-account="forgot-password"', `    <div class="container account-page"><h1 class="account-page__title">Forgot Password</h1><form id="account-form" class="account-form"><label class="form-field"><span>Email</span><input type="email" name="email" required></label><button type="submit" class="btn btn--pill">Send Link</button></form></div>`, '  <script src="js/account-page.js"></script>'),
  'reset-password.html': page('Reset Password', 'Reset', 'data-account="reset-password"', `    <div class="container account-page"><h1 class="account-page__title">Reset Password</h1><form id="account-form" class="account-form"><label class="form-field"><span>New Password</span><input type="password" name="password" minlength="8" required></label><button type="submit" class="btn btn--pill">Update</button></form></div>`, '  <script src="js/account-page.js"></script>'),
  'profile.html': page('Profile', 'Profile', 'data-account="profile"', `    <div class="container account-page"><h1 class="account-page__title">Profile</h1><p><strong id="profile-name"></strong></p><p id="profile-email"></p><nav class="account-nav"><a href="addresses.html">Addresses</a><a href="payment-methods.html">Payment Methods</a><a href="notifications.html">Notifications</a><a href="settings.html">Settings</a><a href="orders.html">Orders</a><a href="wishlist.html">Wishlist</a></nav></div>`, '  <script src="js/account-page.js"></script>'),
  'addresses.html': page('Addresses', 'Addresses', 'data-account="addresses"', '    <div class="container account-page"><h1 class="account-page__title">Addresses</h1><p class="account-page__lead">Manage shipping addresses.</p><a href="profile.html" class="btn btn--pill btn--outline">Back</a></div>', '  <script src="js/account-page.js"></script>'),
  'payment-methods.html': page('Payment Methods', 'Payments', 'data-account="payment-methods"', '    <div class="container account-page"><h1 class="account-page__title">Payment Methods</h1><p class="account-page__lead">Saved cards for faster checkout.</p><a href="profile.html" class="btn btn--pill btn--outline">Back</a></div>', '  <script src="js/account-page.js"></script>'),
  'notifications.html': page('Notifications', 'Notifications', 'data-account="notifications"', '    <div class="container account-page"><h1 class="account-page__title">Notifications</h1><p class="account-page__lead">Email and push preferences.</p><a href="profile.html" class="btn btn--pill btn--outline">Back</a></div>', '  <script src="js/account-page.js"></script>'),
  'settings.html': page('Settings', 'Settings', 'data-account="settings"', '    <div class="container account-page"><h1 class="account-page__title">Settings</h1><p class="account-page__lead">Account preferences.</p><a href="profile.html" class="btn btn--pill btn--outline">Back</a></div>', '  <script src="js/account-page.js"></script>'),
  '404.html': page('404 — Not Found', '404', '', '    <div class="container content-page content-page--404"><p class="eyebrow">404</p><h1 class="content-page__title">Page Not Found</h1><a href="index.html" class="btn btn--pill">Home</a></div>', ''),
  'error.html': page('Error', 'Error', '', '    <div class="container content-page"><p class="eyebrow">Error</p><h1 class="content-page__title">Something Went Wrong</h1><a href="support.html" class="btn btn--pill">Get Help</a></div>', ''),
};

const catalogIds = [
  'new-arrivals',
  'best-sellers',
  'trending',
  'sale',
  'featured',
  'running',
  'training',
  'basketball',
  'lifestyle',
  'jordan',
  'air-max',
];

function catalogPage(catalogId) {
  const file = `${catalogId}.html`;
  const title = catalogId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return [
    file,
    page(
      `${title} — ARCHIVE`,
      `Shop ${title}`,
      `data-catalog="${catalogId}"`,
      `    <div class="page-hero">
      <div class="container">
        <p class="eyebrow" id="catalog-eyebrow"></p>
        <h1 class="page-hero__title" id="catalog-title"></h1>
        <p class="page-hero__lead" id="catalog-lead"></p>
        <p class="shop-result-count" id="catalog-count" aria-live="polite"></p>
      </div>
    </div>
    <div class="container">
      <div class="shop-grid" id="catalog-grid" role="list"></div>
      <div id="catalog-empty" class="shop-empty" hidden>
        <p>No products in this collection yet.</p>
        <a href="shop.html" class="btn btn--pill">Browse All</a>
      </div>
    </div>`,
      '  <script src="js/catalog-page.js"></script>\n  <script src="js/quick-view.js"></script>'
    ),
  ];
}

for (const [file, html] of Object.entries(pages)) {
  fs.writeFileSync(path.join(root, file), html);
  console.log('Created', file);
}

for (const [file, html] of catalogIds.map(catalogPage)) {
  fs.writeFileSync(path.join(root, file), html);
  console.log('Created', file);
}
