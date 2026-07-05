/**
 * ARCHIVE — Product schema helpers (JSDoc + normalization)
 */
(function () {
  'use strict';

  /**
   * @typedef {'front'|'side'|'back'|'angled'|'lifestyle'|'close-up'} ImageAngle
   */

  /**
   * @typedef {Object} ProductImage
   * @property {string} url
   * @property {ImageAngle} angle
   * @property {string} alt
   * @property {number} width
   * @property {number} height
   * @property {string} [webpUrl]
   * @property {string} [avifUrl]
   */

  /**
   * @typedef {Object} ProductColor
   * @property {string} name
   * @property {string} hex
   * @property {ProductImage[]} images
   */

  /**
   * @typedef {Object} ProductSize
   * @property {string} value
   * @property {boolean} inStock
   */

  /**
   * @typedef {Object} Review
   * @property {string} id
   * @property {string} author
   * @property {1|2|3|4|5} rating
   * @property {string} title
   * @property {string} body
   * @property {string} date
   * @property {boolean} verifiedPurchase
   */

  /**
   * @typedef {Object} Product
   * @property {string} id
   * @property {string} sku
   * @property {string} slug
   * @property {string} name
   * @property {'Air Max'|'Jordan'|'Running'|'Training'|'Basketball'|'Lifestyle'} brandLine
   * @property {'Men'|'Women'|'Kids'|'Accessories'} category
   * @property {number} price
   * @property {number} [compareAtPrice]
   * @property {string} currency
   * @property {string} description
   * @property {string[]} features
   * @property {Record<string, string>} specifications
   * @property {ProductSize[]} sizes
   * @property {ProductColor[]} colors
   * @property {ProductImage[]} images
   * @property {{ average: number, count: number }} rating
   * @property {Review[]} reviews
   * @property {string} shippingInfo
   * @property {string} returnPolicy
   * @property {string[]} relatedProductIds
   * @property {string[]} recommendedProductIds
   * @property {string[]} tags
   * @property {boolean} isNew
   * @property {boolean} isBestSeller
   * @property {'in_stock'|'low_stock'|'out_of_stock'|'backorder'} inventoryStatus
   * @property {string} createdAt
   * @property {string} [subcategory] legacy
   * @property {string[]} [imageUrls] legacy flat urls
   * @property {string[]} [colorNames] legacy
   * @property {string[]} [sizeValues] legacy
   */

  const BRAND_LINE_SLUG = {
    'Air Max': 'air-max',
    Jordan: 'jordan',
    Running: 'running',
    Training: 'training',
    Basketball: 'basketball',
    Lifestyle: 'lifestyle',
  };

  const INVENTORY_LABEL = {
    in_stock: 'Available',
    low_stock: 'Low Stock',
    out_of_stock: 'Sold',
    backorder: 'Backorder',
  };

  function imageUrl(img) {
    if (!img) return '';
    return typeof img === 'string' ? img : img.url;
  }

  function normalizeProduct(product) {
    const imageUrls = (product.images || []).map(imageUrl);
    const colorNames = (product.colors || []).map((c) => (typeof c === 'string' ? c : c.name));
    const sizeValues = (product.sizes || []).map((s) => (typeof s === 'string' || typeof s === 'number' ? String(s) : s.value));

    const subcategory =
      product.subcategory ||
      (product.tags || []).find((t) => ['shoes', 'apparel', 'gear'].includes(t)) ||
      inferSubcategory(product);

    // NOTE: intentionally NOT frozen. `withLegacyView` (products-data.js) wraps
    // this object in a Proxy that returns legacy shapes for `category`, `images`,
    // `colors`, and `sizes`. A Proxy `get` trap may only return a value that
    // differs from the target when the target property is configurable/writable;
    // freezing here would violate that invariant and throw a TypeError on read.
    return {
      ...product,
      subcategory,
      imageUrls,
      colorNames,
      sizeValues,
      /** @deprecated use imageUrls[0] */
      get legacyImages() {
        return imageUrls;
      },
    };
  }

  function inferSubcategory(product) {
    const name = product.name.toLowerCase();
    if (product.category === 'Accessories') return 'gear';
    if (/shoe|sneaker|runner|dunk|pegasus|vomero|max|jordan|air/.test(name)) return 'shoes';
    if (/tee|hoodie|jogger|legging|jacket|short|top|bra|tight|pant/.test(name)) return 'apparel';
    return 'gear';
  }

  function getPrimaryImage(product) {
    return product.images?.[0] || null;
  }

  function getPrimaryImageUrl(product) {
    const img = getPrimaryImage(product);
    return img ? imageUrl(img) : '';
  }

  function getHoverImageUrl(product) {
    const img = product.images?.[1] || product.images?.[0];
    return img ? imageUrl(img) : '';
  }

  function getEffectivePrice(product) {
    return product.price;
  }

  function getCompareAtPrice(product) {
    return product.compareAtPrice ?? null;
  }

  function isOnSale(product) {
    return typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.price;
  }

  function getSalePercent(product) {
    if (!isOnSale(product)) return null;
    return Math.round((1 - product.price / product.compareAtPrice) * 100);
  }

  function getBrandLineSlug(product) {
    return BRAND_LINE_SLUG[product.brandLine] || 'lifestyle';
  }

  function matchesCatalogFilter(product, catalogId) {
    switch (catalogId) {
      case 'shop':
        return true;
      case 'new-arrivals':
        return product.isNew;
      case 'best-sellers':
        return product.isBestSeller;
      case 'trending':
        return product.isTrending === true || product.tags.includes('trending');
      case 'sale':
        return product.isOnSale === true || isOnSale(product) || product.tags.includes('sale');
      case 'featured':
        return product.isFeatured === true || product.tags.includes('featured');
      case 'running':
      case 'training':
      case 'basketball':
      case 'lifestyle':
      case 'jordan':
      case 'air-max':
        return getBrandLineSlug(product) === catalogId || product.tags.includes(catalogId);
      default:
        return false;
    }
  }

  function isPurchasable(product, sizeValue, colorName) {
    if (product.inventoryStatus === 'out_of_stock') return false;
    const size = product.sizes.find((s) => s.value === String(sizeValue));
    if (size && !size.inStock && product.inventoryStatus !== 'backorder') return false;
    return product.colors.some((c) => c.name.toLowerCase() === String(colorName).toLowerCase());
  }

  function formatPrice(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
  }

  window.ProductSchema = Object.freeze({
    normalizeProduct,
    imageUrl,
    getPrimaryImage,
    getPrimaryImageUrl,
    getHoverImageUrl,
    getEffectivePrice,
    getCompareAtPrice,
    isOnSale,
    getSalePercent,
    getBrandLineSlug,
    matchesCatalogFilter,
    isPurchasable,
    formatPrice,
    INVENTORY_LABEL,
    BRAND_LINE_SLUG,
  });
})();
