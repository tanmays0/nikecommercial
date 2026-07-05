/**
 * ARCHIVE — Product data API (catalog + legacy compat)
 */
(function () {
  'use strict';

  if (!window.ProductSchema) {
    console.error('[ProductsData] ProductSchema must load before products-data.js');
    return;
  }

  const rawCatalog = window.__PRODUCTS_CATALOG__ || [];
  const legacyAliases = window.__PRODUCTS_LEGACY_ALIASES__ || {};

  const PRODUCTS = rawCatalog.map((p) => ProductSchema.normalizeProduct(p));

  const idIndex = new Map(PRODUCTS.map((p) => [p.id, p]));
  Object.entries(legacyAliases).forEach(([legacyId, newId]) => {
    const product = idIndex.get(newId);
    if (product) idIndex.set(legacyId, product);
  });

  function resolveId(id) {
    if (idIndex.has(id)) return id;
    const aliased = legacyAliases[id];
    return aliased || id;
  }

  function getProductById(id) {
    const resolved = resolveId(id);
    return idIndex.get(resolved) || null;
  }

  function getProductBySlug(slug) {
    return PRODUCTS.find((p) => p.slug === slug) || null;
  }

  function getProductsByCategory(category) {
    const cat = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
    const legacy = category.toLowerCase();
    return PRODUCTS.filter(
      (p) =>
        p.category.toLowerCase() === legacy ||
        p.category === cat ||
        (legacy === 'accessories' && p.category === 'Accessories')
    );
  }

  function getProductsByBrandLine(brandLine) {
    return PRODUCTS.filter((p) => p.brandLine === brandLine);
  }

  function getProductsBySubcategory(subcategory) {
    return PRODUCTS.filter((p) => p.subcategory === subcategory);
  }

  function searchProducts(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [...PRODUCTS];

    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.brandLine.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subcategory.includes(q) ||
        p.tags.some((t) => t.includes(q)) ||
        p.colorNames.some((c) => c.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q)
    );
  }

  /** Legacy flat image URL array */
  function getImageUrls(product) {
    return product.imageUrls || product.images.map((img) => ProductSchema.imageUrl(img));
  }

  /** Legacy category key (men/women/kids/accessories) */
  function getLegacyCategory(product) {
    return product.category.toLowerCase();
  }

  /** Proxy legacy field access on product views */
  function withLegacyView(product) {
    if (!product || product._legacy) return product;
    return new Proxy(product, {
      get(target, prop) {
        if (prop === 'images') return getImageUrls(target);
        if (prop === 'colors') return target.colorNames;
        if (prop === 'sizes') return target.sizeValues;
        if (prop === 'category') return getLegacyCategory(target);
        return target[prop];
      },
    });
  }

  function getLegacyProductById(id) {
    const product = getProductById(id);
    return product ? withLegacyView(product) : null;
  }

  const CATEGORIES = ['men', 'women', 'kids', 'accessories'];
  const SUBCATEGORIES = ['shoes', 'apparel', 'gear'];

  window.ProductsData = Object.freeze({
    PRODUCTS: PRODUCTS.map(withLegacyView),
    RAW_PRODUCTS: PRODUCTS,
    CATEGORIES,
    SUBCATEGORIES,
    LEGACY_ALIASES: legacyAliases,
    getProductById: getLegacyProductById,
    getRawProductById: getProductById,
    getProductBySlug,
    getProductsByCategory,
    getProductsByBrandLine,
    getProductsBySubcategory,
    searchProducts: (q) => searchProducts(q).map(withLegacyView),
    getImageUrls,
    withLegacyView,
  });
})();
