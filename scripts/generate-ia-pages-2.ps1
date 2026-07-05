# Phase 1 IA — content, account, discovery, checkout, system pages
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function New-IAPage {
  param([string]$FileName,[string]$Title,[string]$Description,[string]$BodyAttrs,[string]$MainHtml,[string[]]$ExtraScripts = @())
  $scripts = @(
    '  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>',
    '  <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js"></script>',
    '  <script src="js/site-config.js"></script>',
    '  <script src="js/products-data.js"></script>',
    '  <script src="js/wishlist-engine.js"></script>',
    '  <script src="js/cart-engine.js"></script>',
    '  <script src="js/cart-ui.js"></script>',
    '  <script src="js/cart-drawer.js"></script>',
    '  <script src="js/site-shell.js"></script>',
    '  <script src="js/pages.js"></script>'
  ) + ($ExtraScripts | ForEach-Object { "  $_" })
  $html = @"
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="$Description">
  <meta name="theme-color" content="#0b0b0b">
  <title>$Title</title>
  <link rel="icon" href="data:,">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,400&display=swap" rel="stylesheet">
  <link href="https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body class="page-inner" $BodyAttrs>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div id="site-header-mount"></div>
  <main id="main-content">
$MainHtml
  </main>
  <div id="site-footer-mount"></div>
$($scripts -join "`n")
</body>
</html>
"@
  [System.IO.File]::WriteAllText((Join-Path $Root $FileName), $html)
}

$contentIds = @('about','contact','faqs','shipping-info','returns-policy','privacy-policy','terms-of-service','gift-cards','sustainability','careers','accessibility','size-guide')
foreach ($id in $contentIds) {
  New-IAPage "$id.html" "$id — ARCHIVE" "Information" "data-content=`"$id`"" '    <div class="container content-page-wrap" id="content-main"></div>' @('<script src="js/content-page.js"></script>')
}

New-IAPage 'search.html' 'Search — ARCHIVE' 'Search products' '' @'
    <div class="page-hero"><div class="container"><p class="eyebrow">Discovery</p><h1 class="page-hero__title">SEARCH</h1></div></div>
    <div class="container search-page">
      <label class="search-page__field"><span class="visually-hidden">Search</span><input type="search" id="search-input" placeholder="Search shoes, apparel, gear…" autocomplete="off"></label>
      <p class="search-page__count" id="search-count" aria-live="polite"></p>
      <div id="search-results" class="search-page__results"></div>
      <div id="search-empty" class="shop-empty" hidden><p>No results found.</p><a href="shop.html" class="btn btn--pill">Browse All</a></div>
    </div>
'@ @('<script src="js/search-page.js"></script>')

New-IAPage 'store-locator.html' 'Store Locator' 'Find a store' 'data-account="store-locator"' @'
    <div class="page-hero"><div class="container"><p class="eyebrow">Discovery</p><h1 class="page-hero__title">STORE LOCATOR</h1><p class="page-hero__lead">Visit Velocity House locations worldwide.</p></div></div>
    <div class="container" id="store-list"></div>
'@ @('<script src="js/account-page.js"></script>')

New-IAPage 'collections.html' 'Collections' 'Editorial collections' '' @'
    <div class="page-hero"><div class="container"><p class="eyebrow">Editorial</p><h1 class="page-hero__title">COLLECTIONS</h1></div></div>
    <div class="container collections-grid" id="collections-list"></div>
'@ @('<script src="js/collection-page.js"></script>')

New-IAPage 'collection.html' 'Collection' 'Collection detail' '' @'
    <div id="collection-hero"></div>
    <div class="container shop-grid" id="collection-grid" role="list"></div>
'@ @('<script src="js/collection-page.js"></script>')

New-IAPage 'wishlist.html' 'Wishlist' 'Saved items' '' @'
    <div class="page-hero"><div class="container"><p class="eyebrow">Account</p><h1 class="page-hero__title">WISHLIST</h1></div></div>
    <div class="container"><div id="wishlist-empty" class="shop-empty"><p>Your wishlist is empty.</p><a href="shop.html" class="btn btn--pill">Shop Now</a></div><div class="shop-grid" id="wishlist-grid"></div></div>
'@ @('<script src="js/discovery-page.js"></script>')

New-IAPage 'recently-viewed.html' 'Recently Viewed' 'Recently viewed products' '' @'
    <div class="page-hero"><div class="container"><p class="eyebrow">Discovery</p><h1 class="page-hero__title">RECENTLY VIEWED</h1></div></div>
    <div class="container"><div id="recent-empty" class="shop-empty"><p>No recently viewed items.</p><a href="shop.html" class="btn btn--pill">Start Shopping</a></div><div class="shop-grid" id="recent-grid"></div></div>
'@ @('<script src="js/discovery-page.js"></script>')

New-IAPage 'compare.html' 'Compare Products' 'Compare up to 4 products' '' @'
    <div class="page-hero"><div class="container"><p class="eyebrow">Product</p><h1 class="page-hero__title">COMPARE</h1><p class="page-hero__lead">Add products via URL: compare.html?ids=id1,id2</p></div></div>
    <div class="container"><div id="compare-empty" class="shop-empty"><p>No products to compare.</p><a href="shop.html" class="btn btn--pill">Browse Shop</a></div><div id="compare-grid"></div></div>
'@ @('<script src="js/discovery-page.js"></script>')

New-IAPage 'checkout.html' 'Checkout' 'Secure checkout' '' @'
    <div class="container checkout-page">
      <h1 class="checkout-page__title">Checkout</h1>
      <ol class="checkout-steps">
        <li data-checkout-step="1" class="is-active">Shipping</li>
        <li data-checkout-step="2">Payment</li>
        <li data-checkout-step="3">Review</li>
      </ol>
      <form id="checkout-form" class="checkout-form">
        <div data-checkout-panel="1"><h2>Shipping</h2><label class="form-field"><span>Full Name</span><input name="name" required></label><label class="form-field"><span>Address</span><input name="address" required></label><label class="form-field"><span>City</span><input name="city" required></label><button type="button" class="btn btn--pill" data-checkout-next>Continue to Payment</button></div>
        <div data-checkout-panel="2" hidden><h2>Payment</h2><label class="form-field"><span>Card Number</span><input name="card" placeholder="4242 4242 4242 4242" required></label><label class="form-field"><span>Expiry</span><input name="expiry" placeholder="MM/YY" required></label><button type="button" class="btn btn--pill btn--outline" data-checkout-back>Back</button><button type="button" class="btn btn--pill" data-checkout-next>Review Order</button></div>
        <div data-checkout-panel="3" hidden><h2>Review</h2><p>Mock payment — no charge will be made.</p><button type="button" class="btn btn--pill btn--outline" data-checkout-back>Back</button><button type="submit" class="btn btn--pill">Place Order</button></div>
      </form>
      <aside id="checkout-summary" class="checkout-summary"></aside>
    </div>
'@ @('<script src="js/checkout-page.js"></script>')

New-IAPage 'order-confirmation.html' 'Order Confirmed' 'Thank you' 'data-account="order-confirmation"' @'
    <div class="container content-page"><p class="eyebrow">Success</p><h1 class="content-page__title">Thank You</h1><p class="content-page__lead">Your order <strong id="confirmation-id"></strong> has been placed.</p><a href="order-tracking.html" class="btn btn--pill">Track Order</a><a href="shop.html" class="btn btn--pill btn--outline">Continue Shopping</a></div>
'@ @('<script src="js/account-page.js"></script>')

New-IAPage 'orders.html' 'Order History' 'Your orders' 'data-account="orders"' @'
    <div class="container account-page"><h1 class="account-page__title">Order History</h1><div id="orders-empty" class="shop-empty"><p>No orders yet.</p><a href="shop.html" class="btn btn--pill">Shop Now</a></div><div id="orders-list" class="orders-list"></div></div>
'@ @('<script src="js/account-page.js"></script>')

New-IAPage 'order-detail.html' 'Order Detail' 'Order details' 'data-account="order-detail"' @'
    <div class="container account-page" id="order-detail"></div>
'@ @('<script src="js/account-page.js"></script>')

New-IAPage 'order-tracking.html' 'Track Order' 'Order status' 'data-account="order-tracking"' @'
    <div class="container account-page"><h1 class="account-page__title">Track Order</h1><form id="tracking-form" class="account-form"><label class="form-field"><span>Order ID</span><input name="orderId" required placeholder="VA-…"></label><button type="submit" class="btn btn--pill">Track</button></form><div id="tracking-result"></div></div>
'@ @('<script src="js/account-page.js"></script>')

New-IAPage 'login.html' 'Sign In' 'Account login' 'data-account="login"' @'
    <div class="container account-page"><h1 class="account-page__title">Sign In</h1><form id="account-form" class="account-form"><label class="form-field"><span>Email</span><input type="email" name="email" required></label><button type="submit" class="btn btn--pill">Sign In</button></form><p><a href="register.html">Create account</a> · <a href="forgot-password.html">Forgot password?</a></p></div>
'@ @('<script src="js/account-page.js"></script>')

New-IAPage 'register.html' 'Register' 'Create account' 'data-account="register"' @'
    <div class="container account-page"><h1 class="account-page__title">Create Account</h1><form id="account-form" class="account-form"><label class="form-field"><span>Name</span><input type="text" name="name" required></label><label class="form-field"><span>Email</span><input type="email" name="email" required></label><button type="submit" class="btn btn--pill">Register</button></form></div>
'@ @('<script src="js/account-page.js"></script>')

New-IAPage 'forgot-password.html' 'Forgot Password' 'Reset link' 'data-account="forgot-password"' @'
    <div class="container account-page"><h1 class="account-page__title">Forgot Password</h1><form id="account-form" class="account-form"><label class="form-field"><span>Email</span><input type="email" name="email" required></label><button type="submit" class="btn btn--pill">Send Reset Link</button></form></div>
'@ @('<script src="js/account-page.js"></script>')

New-IAPage 'reset-password.html' 'Reset Password' 'New password' 'data-account="reset-password"' @'
    <div class="container account-page"><h1 class="account-page__title">Reset Password</h1><form id="account-form" class="account-form"><label class="form-field"><span>New Password</span><input type="password" name="password" minlength="8" required></label><button type="submit" class="btn btn--pill">Update Password</button></form></div>
'@ @('<script src="js/account-page.js"></script>')

New-IAPage 'profile.html' 'Profile' 'Your profile' 'data-account="profile"' @'
    <div class="container account-page"><h1 class="account-page__title">Profile</h1><p><strong id="profile-name"></strong></p><p id="profile-email"></p><nav class="account-nav"><a href="addresses.html">Addresses</a><a href="payment-methods.html">Payment Methods</a><a href="notifications.html">Notifications</a><a href="settings.html">Settings</a><a href="orders.html">Orders</a><a href="wishlist.html">Wishlist</a></nav></div>
'@ @('<script src="js/account-page.js"></script>')

foreach ($p in @('addresses','payment-methods','notifications','settings')) {
  $title = ($p.Substring(0,1).ToUpper() + $p.Substring(1)) -replace '-',' '
  New-IAPage "$p.html" "$title" "Account" "data-account=`"$p`"" "    <div class=`"container account-page`"><h1 class=`"account-page__title`">$title</h1><p class=`"account-page__lead`">Manage your preferences. Data is stored locally in this concept storefront.</p><a href=`"profile.html`" class=`"btn btn--pill btn--outline`">Back to Profile</a></div>" @('<script src="js/account-page.js"></script>')
}

New-IAPage '404.html' 'Page Not Found' '404' '' @'
    <div class="container content-page content-page--404"><p class="eyebrow">404</p><h1 class="content-page__title">Page Not Found</h1><p class="content-page__lead">The page you requested does not exist.</p><a href="index.html" class="btn btn--pill">Return Home</a><a href="shop.html" class="btn btn--pill btn--outline">Shop All</a></div>
'@ @()

New-IAPage 'error.html' 'Something Went Wrong' 'Error' '' @'
    <div class="container content-page"><p class="eyebrow">Error</p><h1 class="content-page__title">Something Went Wrong</h1><p class="content-page__lead">Please try again or contact support if the problem persists.</p><a href="index.html" class="btn btn--pill">Return Home</a><a href="support.html" class="btn btn--pill btn--outline">Get Help</a></div>
'@ @()

Write-Host "All IA pages generated."
