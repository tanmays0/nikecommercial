/**
 * ARCHIVE — Global Cart State Engine
 * Persists cart across multi-page routes via localStorage.
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'nikecommercial_cart';
  const EVENT_NAME = 'nikeCartUpdated';

  /** @type {Array<{productId:string,name:string,price:number,image:string,size:number|string,color:string,quantity:number,addedAt:number}>} */
  let cart = [];

  function lineKey(productId, size, color) {
    return `${productId}::${String(size)}::${String(color)}`;
  }

  function normalizeSize(size) {
    return String(size).trim();
  }

  function normalizeColor(color) {
    return String(color).trim();
  }

  function getProduct(productId) {
    if (!window.ProductsData) return null;
    return ProductsData.getRawProductById(productId);
  }

  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        cart = [];
        return;
      }

      const parsed = JSON.parse(raw);
      cart = Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      cart = [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.error('[CartEngine] Failed to persist cart:', err);
    }
  }

  function dispatchUpdate() {
    const detail = {
      cart: getCart(),
      count: getCartCount(),
      total: getCartTotal(),
    };

    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
  }

  function getCart() {
    return cart.map((item) => ({ ...item }));
  }

  function getCartCount() {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  function getCartTotal() {
    return cart.reduce((sum, item) => {
      const product = getProduct(item.productId);
      const unitPrice = product ? product.price : item.price || 0;
      return sum + unitPrice * item.quantity;
    }, 0);
  }

  function getSubtotal() {
    return window.Pricing ? Pricing.subtotal(cart) : getCartTotal();
  }

  function getSummary(opts = {}) {
    if (window.Pricing) return Pricing.summarize(cart, opts);
    const total = getCartTotal();
    return { subtotal: total, discount: 0, shipping: 0, tax: 0, total };
  }

  function findLineIndex(productId, size, color) {
    const key = lineKey(productId, size, color);
    return cart.findIndex(
      (item) => lineKey(item.productId, item.size, item.color) === key
    );
  }

  function validateProductOptions(productId, size, color) {
    const product = getProduct(productId);
    if (!product) {
      throw new Error(`[CartEngine] Unknown product: ${productId}`);
    }

    const sizeStr = String(normalizeSize(size));
    const colorStr = normalizeColor(color);

    const sizeEntry = product.sizes.find((s) => String(s.value ?? s) === sizeStr);
    const sizeValid = Boolean(sizeEntry);
    const colorValid = product.colors.some(
      (c) => (typeof c === 'string' ? c : c.name).toLowerCase() === colorStr.toLowerCase()
    );

    if (!sizeValid) {
      throw new Error(`[CartEngine] Invalid size "${size}" for ${productId}`);
    }

    if (!colorValid) {
      throw new Error(`[CartEngine] Invalid color "${color}" for ${productId}`);
    }

    if (product.inventoryStatus === 'out_of_stock') {
      throw new Error(`[CartEngine] ${product.name} is out of stock`);
    }

    if (sizeEntry && sizeEntry.inStock === false && product.inventoryStatus !== 'backorder') {
      throw new Error(`[CartEngine] Size "${size}" is unavailable for ${productId}`);
    }

    return product;
  }

  function legacyImageUrl(product) {
    if (window.ProductSchema) return ProductSchema.getPrimaryImageUrl(product);
    const img = product.images?.[0];
    return typeof img === 'string' ? img : img?.url || '';
  }

  function addToCart(productId, size, color, quantity = 1) {
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    const product = validateProductOptions(productId, size, color);

    const normalizedSize = normalizeSize(size);
    const normalizedColor = normalizeColor(color);
    const index = findLineIndex(productId, normalizedSize, normalizedColor);

    if (index > -1) {
      cart[index].quantity += qty;
    } else {
      cart.push({
        productId,
        name: product.name,
        price: product.price,
        image: legacyImageUrl(product),
        size: normalizedSize,
        color: normalizedColor,
        quantity: qty,
        addedAt: Date.now(),
      });
    }

    saveCart();
    dispatchUpdate();
    return getCart();
  }

  function removeFromCart(productId, size, color) {
    const index = findLineIndex(productId, normalizeSize(size), normalizeColor(color));

    if (index > -1) {
      cart.splice(index, 1);
      saveCart();
      dispatchUpdate();
    }

    return getCart();
  }

  function updateQuantity(productId, size, color, newQty) {
    const qty = Math.floor(Number(newQty) || 0);
    const index = findLineIndex(productId, normalizeSize(size), normalizeColor(color));

    if (index === -1) {
      throw new Error(`[CartEngine] Line item not found: ${productId}`);
    }

    if (qty <= 0) {
      return removeFromCart(productId, size, color);
    }

    cart[index].quantity = qty;
    saveCart();
    dispatchUpdate();
    return getCart();
  }

  function clearCart() {
    cart = [];
    saveCart();
    dispatchUpdate();
    return getCart();
  }

  loadCart();
  dispatchUpdate();

  // Cross-tab sync: mirror cart changes made in other tabs/windows.
  window.addEventListener('storage', (e) => {
    if (e.key !== STORAGE_KEY) return;
    loadCart();
    dispatchUpdate();
  });

  window.CartEngine = Object.freeze({
    EVENT_NAME,
    STORAGE_KEY,
    getCart,
    getCartCount,
    getCartTotal,
    getSubtotal,
    getSummary,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
  });
})();
