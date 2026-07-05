/**
 * ARCHIVE — Cart UI (badge + toast feedback)
 */
(function () {
  'use strict';

  const badge = document.getElementById('cart-count');
  const badgeLink = document.getElementById('cart-badge');

  function renderCartBadge(count) {
    if (!badge) return;

    if (count > 0) {
      badge.textContent = String(count);
      badge.hidden = false;
      if (badgeLink) {
        badgeLink.setAttribute('aria-label', `Shopping bag, ${count} item${count === 1 ? '' : 's'}`);
      }
    } else {
      badge.textContent = '0';
      badge.hidden = true;
      if (badgeLink) {
        badgeLink.setAttribute('aria-label', 'Shopping bag, empty');
      }
    }

    if (window.Dom && count > 0) {
      Dom.announce(`Shopping bag updated, ${count} item${count === 1 ? '' : 's'}`);
    }
  }

  function showAddedToast(productName) {
    let toast = document.getElementById('cart-toast');

    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'cart-toast';
      toast.className = 'cart-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }

    toast.textContent = `Added to bag — ${productName}`;
    toast.classList.add('is-visible');

    clearTimeout(showAddedToast._timer);
    showAddedToast._timer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 2800);
  }

  window.showCartToast = showAddedToast;

  if (window.CartEngine) {
    renderCartBadge(CartEngine.getCartCount());
  }

  window.addEventListener('nikeCartUpdated', (e) => {
    renderCartBadge(e.detail.count);
  });
})();
