/**
 * Nike Commercial — Product detail page (split-screen hydration)
 */
(function () {
  'use strict';

  if (!window.ProductsData || !window.CartEngine) return;

  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  const product = productId ? window.ProductsData.getProductById(productId) : null;

  const notFoundEl = document.getElementById('product-not-found');
  const contentEl = document.getElementById('product-detail-content');
  const gallery = document.getElementById('product-gallery');
  const categoryEl = document.getElementById('product-category');
  const titleEl = document.getElementById('product-title');
  const priceEl = document.getElementById('product-price');
  const descEl = document.getElementById('product-desc');
  const sizeGrid = document.getElementById('size-grid');
  const colorGrid = document.getElementById('color-grid');
  const addBtn = document.getElementById('add-to-bag');

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

  function showNotFound() {
    if (notFoundEl) notFoundEl.hidden = false;
    if (contentEl) contentEl.hidden = true;
    document.title = 'Product Not Found — Nike';
  }

  if (!product) {
    showNotFound();
    return;
  }

  if (notFoundEl) notFoundEl.hidden = true;
  if (contentEl) contentEl.hidden = false;

  document.title = `${product.name} — Nike`;

  if (categoryEl) {
    categoryEl.textContent = `${categoryLabel[product.category] || product.category} · ${subLabel[product.subcategory] || product.subcategory}`;
  }

  if (titleEl) titleEl.textContent = product.name;
  if (priceEl) priceEl.textContent = `$${product.price}`;
  if (descEl) descEl.textContent = product.description;

  if (gallery) {
    const stackImages = product.images.length > 1 ? product.images.slice(1) : product.images;

    gallery.innerHTML = stackImages
      .map(
        (src, i) => `
        <figure class="product-detail__figure">
          <img src="${src}" alt="" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async" width="900" height="1125">
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
        (size) => `
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
