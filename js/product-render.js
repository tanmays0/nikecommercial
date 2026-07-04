/**
 * Nike Commercial — Product detail page renderer
 */
(function () {
  'use strict';

  if (!window.ProductsData || !window.CartEngine) return;

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id') || 'nike-air-max-pulse-01';
  const product = window.ProductsData.getProductById(productId);

  const gallery = document.getElementById('product-gallery');
  const categoryEl = document.getElementById('product-category');
  const titleEl = document.getElementById('product-title');
  const priceEl = document.getElementById('product-price');
  const descEl = document.getElementById('product-desc');
  const sizeGrid = document.getElementById('size-grid');
  const colorGrid = document.getElementById('color-grid');
  const addBtn = document.getElementById('add-to-bag');

  if (!product) {
    if (titleEl) titleEl.textContent = 'Product Not Found';
    return;
  }

  document.title = `${product.name} — Nike`;

  const categoryLabel = {
    men: "Men's",
    women: "Women's",
    kids: "Kids'",
    accessories: 'Accessories',
  };

  const subLabel = {
    shoes: 'Shoes',
    apparel: 'Apparel',
    gear: 'Gear',
  };

  if (categoryEl) {
    categoryEl.textContent = `${categoryLabel[product.category] || product.category} · ${subLabel[product.subcategory] || product.subcategory}`;
  }

  if (titleEl) titleEl.textContent = product.name;
  if (priceEl) priceEl.textContent = `$${product.price}`;
  if (descEl) descEl.textContent = product.description;

  if (gallery) {
    gallery.innerHTML = product.images
      .map(
        (src, i) => `
      <figure class="product-pdp__image${i % 2 === 1 ? ' product-pdp__image--tall' : ''}">
        <img src="${src}" alt="" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async" width="800" height="${i % 2 === 1 ? 1000 : 800}">
      </figure>
    `
      )
      .join('');
  }

  let selectedSize = String(product.sizes[Math.min(2, product.sizes.length - 1)]);
  let selectedColor = product.colors[0];

  if (sizeGrid) {
    sizeGrid.innerHTML = product.sizes
      .map(
        (size, i) => `
      <button
        type="button"
        class="size-selector__btn${String(size) === selectedSize ? ' is-selected' : ''}"
        data-size="${size}"
        aria-pressed="${String(size) === selectedSize ? 'true' : 'false'}"
      >${size}</button>
    `
      )
      .join('');

    sizeGrid.querySelectorAll('.size-selector__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        sizeGrid.querySelectorAll('.size-selector__btn').forEach((b) => {
          b.classList.remove('is-selected');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-selected');
        btn.setAttribute('aria-pressed', 'true');
        selectedSize = btn.dataset.size;
      });
    });
  }

  if (colorGrid) {
    colorGrid.innerHTML = product.colors
      .map(
        (color, i) => `
      <button
        type="button"
        class="color-selector__btn${i === 0 ? ' is-selected' : ''}"
        data-color="${color}"
        aria-pressed="${i === 0 ? 'true' : 'false'}"
      >${color}</button>
    `
      )
      .join('');

    colorGrid.querySelectorAll('.color-selector__btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        colorGrid.querySelectorAll('.color-selector__btn').forEach((b) => {
          b.classList.remove('is-selected');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('is-selected');
        btn.setAttribute('aria-pressed', 'true');
        selectedColor = btn.dataset.color;
      });
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      try {
        CartEngine.addToCart(product.id, selectedSize, selectedColor, 1);

        if (window.openCartDrawer) {
          window.openCartDrawer();
        } else if (window.showCartToast) {
          window.showCartToast(product.name);
        }
        addBtn.textContent = 'Added to Bag';
        setTimeout(() => {
          addBtn.textContent = 'Add to Bag';
        }, 2000);
      } catch (err) {
        console.error(err);
        if (window.showCartToast) {
          window.showCartToast('Please select a valid size and color');
        }
      }
    });
  }
})();
