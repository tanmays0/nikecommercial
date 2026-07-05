/**
 * ARCHIVE — Catalog listing pages (shop, sale, lines, etc.)
 */
(function () {
  'use strict';

  const grid = document.getElementById('catalog-grid');
  const heroTitle = document.getElementById('catalog-title');
  const heroEyebrow = document.getElementById('catalog-eyebrow');
  const heroLead = document.getElementById('catalog-lead');
  const resultCount = document.getElementById('catalog-count');
  const emptyEl = document.getElementById('catalog-empty');

  if (!grid || !window.SiteConfig || !window.ProductsData || !window.ProductCard) return;

  const catalogId = document.body.dataset.catalog || 'shop';
  const page = SiteConfig.CATALOG_PAGES[catalogId];

  if (!page) {
    if (heroTitle) heroTitle.textContent = 'Page Not Found';
    return;
  }

  document.title = `${page.title} — ARCHIVE`;
  if (window.Seo) {
    Seo.setPageMeta({
      title: `${page.title} — ARCHIVE`,
      description: page.lead || `${page.title} at ARCHIVE.`,
    });
  }

  if (heroTitle) heroTitle.textContent = page.title.toUpperCase();
  if (heroEyebrow) heroEyebrow.textContent = page.eyebrow;
  if (heroLead) heroLead.textContent = page.lead;

  function render() {
    const products = SiteConfig.getCatalogProducts(catalogId);

    if (resultCount) {
      resultCount.textContent = `${products.length} product${products.length === 1 ? '' : 's'}`;
    }

    if (emptyEl) emptyEl.hidden = products.length > 0;

    grid.innerHTML = products
      .map((p) => ProductCard.buildShopCard(p, { tag: p.subcategory }))
      .join('');
  }

  render();
})();
