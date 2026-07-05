# Generates Phase 1 IA HTML pages
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function New-IAPage {
  param(
    [string]$FileName,
    [string]$Title,
    [string]$Description,
    [string]$BodyAttrs,
    [string]$MainHtml,
    [string[]]$ExtraScripts = @()
  )

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
  Write-Host "Created $FileName"
}

$catalogMain = @'
    <div class="page-hero">
      <div class="container">
        <p class="eyebrow" id="catalog-eyebrow"></p>
        <h1 class="page-hero__title" id="catalog-title"></h1>
        <p class="page-hero__lead" id="catalog-lead"></p>
        <p class="shop-result-count" id="catalog-count" aria-live="polite"></p>
      </div>
    </div>
    <div class="container shop-layout shop-layout--full">
      <div class="shop-grid" id="catalog-grid" role="list"></div>
      <div id="catalog-empty" class="shop-empty" hidden>
        <p>No products in this collection yet.</p>
        <a href="shop.html" class="btn btn--pill">Shop All</a>
      </div>
    </div>
'@

@(
  'new-arrivals','best-sellers','trending','sale','featured',
  'running','training','basketball','lifestyle','jordan','air-max'
) | ForEach-Object {
  New-IAPage -FileName "$_.html" -Title "$_ — ARCHIVE" -Description "Shop $_" -BodyAttrs "data-catalog=`"$_`"" -MainHtml $catalogMain -ExtraScripts @('<script src="js/catalog-page.js"></script>')
}

$contentIds = @('about','contact','faqs','shipping-info','returns-policy','privacy-policy','terms-of-service','gift-cards','sustainability','careers','accessibility','size-guide')
$contentIds | ForEach-Object {
  New-IAPage -FileName "$_.html" -Title "$_ — ARCHIVE" -Description "Information" -BodyAttrs "data-content=`"$_`"" -MainHtml '    <div class="container content-page-wrap" id="content-main"></div>' -ExtraScripts @('<script src="js/content-page.js"></script>')
}

Write-Host "Catalog and content pages complete."
