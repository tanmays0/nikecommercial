/**
 * ARCHIVE — Account, auth, and order page controllers
 */
(function () {
  'use strict';

  const page = document.body.dataset.account;
  if (!page) return;

  const money = (n) => (window.Format ? Format.money(n) : `$${n}`);
  const esc = (s) => (window.Dom ? Dom.escapeHtml(s) : String(s));

  /* Legacy-compatible accessor (used elsewhere). */
  window.AccountEngine = Object.freeze({
    getUser: () => window.AuthEngine?.getSession() || null,
    getOrders: () => window.OrderEngine?.getOrders() || [],
    AUTH_KEY: window.AuthEngine?.SESSION_KEY,
  });

  function requireAuth() {
    if (!window.AuthEngine?.isLoggedIn()) {
      const next = encodeURIComponent(window.location.pathname.split('/').pop());
      window.location.href = `login.html?next=${next}`;
      return false;
    }
    return true;
  }

  function setFieldError(form, field, msg) {
    if (window.Validation) return Validation.setFieldError(form, field, msg);
    const el = form.querySelector(`[data-error-for="${field}"]`);
    const input = form[field];
    if (el) el.textContent = msg || '';
    if (input) input.classList.toggle('is-invalid', Boolean(msg));
  }

  function clearErrors(form) {
    if (window.Validation) return Validation.clearErrors(form);
    form.querySelectorAll('[data-error-for]').forEach((el) => (el.textContent = ''));
    form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  }

  function showMessage(id, text, type) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.hidden = !text;
    el.className = type ? `form-message form-message--${type}` : 'form-message';
    if (!el.hasAttribute('role')) el.setAttribute('role', 'alert');
    if (!el.hasAttribute('aria-live')) el.setAttribute('aria-live', 'polite');
    if (text && window.Dom) Dom.announce(text, type === 'error' ? 'assertive' : 'polite');
  }

  function setBusy(btn, busy, busyText) {
    if (!btn) return;
    if (busy) {
      btn.dataset.label = btn.textContent;
      btn.disabled = true;
      btn.textContent = busyText || 'Please wait…';
    } else {
      btn.disabled = false;
      if (btn.dataset.label) btn.textContent = btn.dataset.label;
    }
  }

  function nextParam() {
    return new URLSearchParams(window.location.search).get('next') || 'profile.html';
  }

  /* ============================ AUTH ============================ */
  if (page === 'login') {
    const form = document.getElementById('account-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors(form);
      showMessage('account-message', '', null);
      const btn = form.querySelector('button[type="submit"]');
      setBusy(btn, true, 'Signing in…');

      AuthEngine.login({ email: form.email.value, password: form.password.value })
        .then(() => {
          window.location.href = nextParam();
        })
        .catch((err) => {
          setBusy(btn, false);
          if (err.field) setFieldError(form, err.field, err.message);
          else showMessage('account-message', err.message, 'error');
        });
    });
  }

  if (page === 'register') {
    const form = document.getElementById('account-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors(form);
      showMessage('account-message', '', null);
      const btn = form.querySelector('button[type="submit"]');
      setBusy(btn, true, 'Creating account…');

      AuthEngine.register({ name: form.name.value, email: form.email.value, password: form.password.value })
        .then(() => {
          window.location.href = 'profile.html';
        })
        .catch((err) => {
          setBusy(btn, false);
          if (err.field) setFieldError(form, err.field, err.message);
          else showMessage('account-message', err.message, 'error');
        });
    });
  }

  if (page === 'forgot-password') {
    const form = document.getElementById('account-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors(form);
      const btn = form.querySelector('button[type="submit"]');
      setBusy(btn, true, 'Sending…');

      AuthEngine.requestPasswordReset({ email: form.email.value })
        .then((res) => {
          setBusy(btn, false);
          showMessage(
            'account-message',
            `Reset code sent (demo code: ${res.token}). Continue to reset your password.`,
            'success'
          );
          setTimeout(() => {
            window.location.href = `reset-password.html?email=${encodeURIComponent(res.email)}&token=${res.token}`;
          }, 1800);
        })
        .catch((err) => {
          setBusy(btn, false);
          if (err.field) setFieldError(form, err.field, err.message);
          else showMessage('account-message', err.message, 'error');
        });
    });
  }

  if (page === 'reset-password') {
    const form = document.getElementById('account-form');
    const params = new URLSearchParams(window.location.search);
    if (form) {
      if (params.get('email')) form.email.value = params.get('email');
      if (params.get('token')) form.token.value = params.get('token');
    }
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors(form);
      const btn = form.querySelector('button[type="submit"]');
      setBusy(btn, true, 'Updating…');

      AuthEngine.resetPassword({ email: form.email.value, token: form.token.value, password: form.password.value })
        .then(() => {
          setBusy(btn, false);
          showMessage('account-message', 'Password updated. Redirecting to sign in…', 'success');
          setTimeout(() => (window.location.href = 'login.html'), 1500);
        })
        .catch((err) => {
          setBusy(btn, false);
          if (err.field) setFieldError(form, err.field, err.message);
          else showMessage('account-message', err.message, 'error');
        });
    });
  }

  /* ============================ PROFILE ============================ */
  if (page === 'profile') {
    if (!requireAuth()) return;
    const session = AuthEngine.getSession();
    const nameEl = document.getElementById('profile-name');
    const emailEl = document.getElementById('profile-email');
    const form = document.getElementById('profile-form');

    if (nameEl) nameEl.textContent = session.name;
    if (emailEl) emailEl.textContent = session.email;
    if (form) {
      form.name.value = session.name;
      form.email.value = session.email;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors(form);
        const btn = form.querySelector('button[type="submit"]');
        setBusy(btn, true, 'Saving…');
        AuthEngine.updateProfile({ name: form.name.value })
          .then(() => {
            setBusy(btn, false);
            if (nameEl) nameEl.textContent = form.name.value;
            showMessage('profile-message', 'Profile updated.', 'success');
          })
          .catch((err) => {
            setBusy(btn, false);
            if (err.field) setFieldError(form, err.field, err.message);
            else showMessage('profile-message', err.message, 'error');
          });
      });
    }

    document.getElementById('logout-btn')?.addEventListener('click', () => {
      AuthEngine.logout();
      window.location.href = 'index.html';
    });
  }

  /* ============================ ADDRESSES ============================ */
  if (page === 'addresses') {
    if (!requireAuth()) return;
    const listEl = document.getElementById('addresses-list');
    const form = document.getElementById('address-form');
    const addBtn = document.getElementById('address-add-btn');
    const cancelBtn = document.getElementById('address-cancel-btn');

    function render() {
      const addresses = AccountStore.getAddresses();
      if (!listEl) return;
      if (addresses.length === 0) {
        listEl.innerHTML = '<p class="account-empty">No saved addresses yet.</p>';
        return;
      }
      listEl.innerHTML = addresses
        .map(
          (a) => `
        <article class="address-card${a.isDefault ? ' is-default' : ''}" data-id="${a.id}">
          ${a.isDefault ? '<span class="address-card__default">Default</span>' : ''}
          <p class="address-card__name">${esc(a.name)}</p>
          <p>${esc(a.line1)}<br>${esc(a.city)}, ${esc(a.state)} ${esc(a.zip)}<br>${esc(a.country)}</p>
          <div class="address-card__actions">
            ${a.isDefault ? '' : '<button type="button" data-action="default">Set Default</button>'}
            <button type="button" data-action="edit">Edit</button>
            <button type="button" data-action="delete">Delete</button>
          </div>
        </article>`
        )
        .join('');

      listEl.querySelectorAll('.address-card').forEach((card) => {
        const id = card.dataset.id;
        card.querySelector('[data-action="default"]')?.addEventListener('click', () => {
          AccountStore.setDefaultAddress(id);
          render();
        });
        card.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
          AccountStore.deleteAddress(id);
          render();
        });
        card.querySelector('[data-action="edit"]')?.addEventListener('click', () => {
          const addr = AccountStore.getAddresses().find((a) => a.id === id);
          if (addr) openForm(addr);
        });
      });
    }

    function openForm(addr) {
      if (!form) return;
      form.hidden = false;
      addBtn.hidden = true;
      form.id.value = addr?.id || '';
      form.name.value = addr?.name || '';
      form.line1.value = addr?.line1 || '';
      form.city.value = addr?.city || '';
      form.state.value = addr?.state || '';
      form.zip.value = addr?.zip || '';
      form.country.value = addr?.country || 'USA';
      form.isDefault.checked = Boolean(addr?.isDefault);
    }

    function closeForm() {
      if (!form) return;
      form.hidden = true;
      addBtn.hidden = false;
      form.reset();
    }

    addBtn?.addEventListener('click', () => openForm(null));
    cancelBtn?.addEventListener('click', closeForm);

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      AccountStore.upsertAddress({
        id: form.id.value || undefined,
        name: form.name.value.trim(),
        line1: form.line1.value.trim(),
        city: form.city.value.trim(),
        state: form.state.value.trim(),
        zip: form.zip.value.trim(),
        country: form.country.value.trim(),
        isDefault: form.isDefault.checked,
      });
      closeForm();
      render();
    });

    render();
  }

  /* ============================ PAYMENT METHODS ============================ */
  if (page === 'payment-methods') {
    if (!requireAuth()) return;
    const listEl = document.getElementById('payment-list');
    const form = document.getElementById('payment-form');
    const addBtn = document.getElementById('payment-add-btn');
    const cancelBtn = document.getElementById('payment-cancel-btn');

    function render() {
      const methods = AccountStore.getPaymentMethods();
      if (!listEl) return;
      if (methods.length === 0) {
        listEl.innerHTML = '<p class="account-empty">No saved cards yet.</p>';
        return;
      }
      listEl.innerHTML = methods
        .map(
          (m) => `
        <article class="payment-card${m.isDefault ? ' is-default' : ''}" data-id="${m.id}">
          ${m.isDefault ? '<span class="payment-card__default">Default</span>' : ''}
          <p class="payment-card__brand">${esc(m.brand)} •••• ${esc(m.last4)}</p>
          <p class="payment-card__meta">${esc(m.name)} · Exp ${esc(m.expiry)}</p>
          <div class="payment-card__actions">
            ${m.isDefault ? '' : '<button type="button" data-action="default">Set Default</button>'}
            <button type="button" data-action="delete">Delete</button>
          </div>
        </article>`
        )
        .join('');

      listEl.querySelectorAll('.payment-card').forEach((card) => {
        const id = card.dataset.id;
        card.querySelector('[data-action="default"]')?.addEventListener('click', () => {
          AccountStore.setDefaultPaymentMethod(id);
          render();
        });
        card.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
          AccountStore.deletePaymentMethod(id);
          render();
        });
      });
    }

    // card number formatting
    form?.number?.addEventListener('input', () => {
      const digits = form.number.value.replace(/\D/g, '').slice(0, 16);
      form.number.value = digits.replace(/(.{4})/g, '$1 ').trim();
    });
    form?.expiry?.addEventListener('input', () => {
      let d = form.expiry.value.replace(/\D/g, '').slice(0, 4);
      if (d.length >= 3) d = `${d.slice(0, 2)}/${d.slice(2)}`;
      form.expiry.value = d;
    });
    form?.cvc?.addEventListener('input', () => {
      form.cvc.value = form.cvc.value.replace(/\D/g, '').slice(0, 4);
    });

    addBtn?.addEventListener('click', () => {
      form.hidden = false;
      addBtn.hidden = true;
    });
    cancelBtn?.addEventListener('click', () => {
      form.hidden = true;
      addBtn.hidden = false;
      form.reset();
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      clearErrors(form);
      const digits = form.number.value.replace(/\D/g, '');
      if (digits.length < 13) return setFieldError(form, 'number', 'Enter a valid card number');
      if (!/^\d{2}\/\d{2}$/.test(form.expiry.value)) return setFieldError(form, 'expiry', 'Use MM/YY');

      AccountStore.addPaymentMethod({
        number: digits,
        expiry: form.expiry.value,
        name: form.name.value.trim(),
      });
      form.hidden = true;
      addBtn.hidden = false;
      form.reset();
      render();
    });

    render();
  }

  /* ============================ SETTINGS ============================ */
  if (page === 'settings') {
    if (!requireAuth()) return;
    const form = document.getElementById('settings-form');
    if (form) {
      const settings = AccountStore.getSettings();
      form.currency.value = settings.currency;
      form.language.value = settings.language;
      form.theme.value = settings.theme;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        AccountStore.saveSettings({
          currency: form.currency.value,
          language: form.language.value,
          theme: form.theme.value,
        });
        showMessage('settings-message', 'Settings saved.', 'success');
      });
    }
  }

  /* ============================ NOTIFICATIONS ============================ */
  if (page === 'notifications') {
    if (!requireAuth()) return;
    const form = document.getElementById('notifications-form');
    if (form) {
      const prefs = AccountStore.getPreferences();
      Object.keys(prefs).forEach((k) => {
        if (form[k]) form[k].checked = Boolean(prefs[k]);
      });
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        AccountStore.savePreferences({
          emailPromotions: form.emailPromotions.checked,
          emailOrders: form.emailOrders.checked,
          pushDrops: form.pushDrops.checked,
          smsShipping: form.smsShipping.checked,
        });
        showMessage('notifications-message', 'Preferences saved.', 'success');
      });
    }
  }

  /* ============================ ORDERS ============================ */
  if (page === 'orders') {
    const list = document.getElementById('orders-list');
    const empty = document.getElementById('orders-empty');
    if (!list) return;

    list.innerHTML = window.MockService ? MockService.spinnerHtml('Loading orders…') : '';
    const fetch = window.MockService
      ? MockService.request(() => OrderEngine.getOrders(), { min: 250, max: 600 })
      : Promise.resolve(OrderEngine.getOrders());

    fetch
      .then((orders) => {
        if (empty) empty.hidden = orders.length > 0;
        if (orders.length === 0) {
          list.innerHTML = '';
          return;
        }
        list.innerHTML = orders
          .map(
            (o) => `
          <a href="order-detail.html?id=${encodeURIComponent(o.id)}" class="order-row">
            <span class="order-row__id">${esc(o.id)}</span>
            <span class="order-row__date">${new Date(o.date).toLocaleDateString()}</span>
            <span class="order-row__total">${money(o.total)}</span>
            <span class="order-row__status order-row__status--${o.status.toLowerCase().replace(/\s+/g, '-')}">${esc(o.status)}</span>
          </a>`
          )
          .join('');
      })
      .catch((err) => {
        list.innerHTML = MockService.errorHtml(err.message);
      });
  }

  /* ============================ ORDER DETAIL ============================ */
  if (page === 'order-detail') {
    const el = document.getElementById('order-detail');
    const id = new URLSearchParams(window.location.search).get('id');
    if (el) el.innerHTML = window.MockService ? MockService.spinnerHtml('Loading order…') : '';

    const fetch = window.MockService
      ? MockService.request(() => OrderEngine.getOrder(id), { min: 250, max: 600 })
      : Promise.resolve(OrderEngine.getOrder(id));

    fetch.then((order) => {
      if (!order || !el) {
        if (el) el.innerHTML = MockService.emptyHtml('Order not found.', '', 'orders.html', 'View All Orders');
        return;
      }
      const timeline = order.timeline || OrderEngine.buildTimeline(order);
      const addr = order.shippingAddress;
      const totals = order.totals || { subtotal: order.total, shipping: 0, tax: 0, total: order.total };

      el.innerHTML = `
        <a href="orders.html" class="account-page__back">← All orders</a>
        <h1 class="account-page__title">Order ${esc(order.id)}</h1>
        <p class="account-page__lead">Placed ${new Date(order.date).toLocaleString()}</p>

        <ol class="order-timeline">
          ${timeline
            .map(
              (t) => `
            <li class="order-timeline__step${t.complete ? ' is-complete' : ''}${t.current ? ' is-current' : ''}">
              <span class="order-timeline__dot"></span>
              <span class="order-timeline__label">${esc(t.label)}</span>
              ${t.date ? `<span class="order-timeline__date">${new Date(t.date).toLocaleDateString()}</span>` : ''}
            </li>`
            )
            .join('')}
        </ol>

        <div class="order-detail__grid">
          <section>
            <h2 class="order-detail__subtitle">Items</h2>
            <ul class="order-detail__items">
              ${order.items
                .map(
                  (i) => `
                <li class="order-detail__item">
                  <a href="product-detail.html?id=${encodeURIComponent(i.productId)}">${esc(i.name)}</a>
                  <span>${esc(i.color)} · Size ${esc(i.size)} · Qty ${i.quantity}</span>
                  <span>${money(i.price * i.quantity)}</span>
                </li>`
                )
                .join('')}
            </ul>
          </section>
          <aside class="order-detail__summary">
            <h2 class="order-detail__subtitle">Summary</h2>
            <dl>
              <div><dt>Subtotal</dt><dd>${money(totals.subtotal)}</dd></div>
              ${totals.discount ? `<div><dt>Discount</dt><dd>−${money(totals.discount)}</dd></div>` : ''}
              <div><dt>Shipping</dt><dd>${totals.shipping === 0 ? 'Free' : money(totals.shipping)}</dd></div>
              <div><dt>Tax</dt><dd>${money(totals.tax)}</dd></div>
              <div class="order-detail__grand"><dt>Total</dt><dd>${money(totals.total)}</dd></div>
            </dl>
            ${
              addr
                ? `<h3 class="order-detail__subtitle">Ship To</h3><p>${esc(addr.name)}<br>${esc(addr.line1)}<br>${esc(addr.city)}, ${esc(addr.state)} ${esc(addr.zip)}</p>`
                : ''
            }
            ${order.payment ? `<h3 class="order-detail__subtitle">Payment</h3><p>${esc(order.payment.brand)} •••• ${esc(order.payment.last4)}</p>` : ''}
          </aside>
        </div>
      `;
    });
  }

  /* ============================ ORDER CONFIRMATION ============================ */
  if (page === 'order-confirmation') {
    const id = new URLSearchParams(window.location.search).get('id');
    const idEl = document.getElementById('confirmation-id');
    const detailEl = document.getElementById('confirmation-detail');
    if (idEl && id) idEl.textContent = id;

    const order = window.OrderEngine ? OrderEngine.getOrder(id) : null;
    if (order && detailEl) {
      const totals = order.totals || { total: order.total };
      detailEl.innerHTML = `
        <ul class="order-confirmation__items">
          ${order.items
            .map(
              (i) => `<li><span>${esc(i.name)} × ${i.quantity}</span><span>${money(i.price * i.quantity)}</span></li>`
            )
            .join('')}
        </ul>
        <p class="order-confirmation__total"><span>Total Paid</span><strong>${money(totals.total)}</strong></p>
        <p class="order-confirmation__ship">Estimated delivery in ${
          order.shippingMethod === 'expedited' ? '1–2' : '3–5'
        } business days.</p>
      `;
    }
  }

  /* ============================ ORDER TRACKING ============================ */
  if (page === 'order-tracking') {
    const form = document.getElementById('tracking-form');
    const result = document.getElementById('tracking-result');
    const prefill = new URLSearchParams(window.location.search).get('id');
    if (prefill && form) form.orderId.value = prefill;

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = form.orderId.value.trim();
      if (!result) return;
      result.innerHTML = window.MockService ? MockService.spinnerHtml('Locating order…') : '';

      const fetch = window.MockService
        ? MockService.request(() => OrderEngine.getOrder(id), { min: 300, max: 700 })
        : Promise.resolve(OrderEngine.getOrder(id));

      fetch.then((order) => {
        if (!order) {
          result.innerHTML = '<p class="form-message form-message--error">No order found with that ID.</p>';
          return;
        }
        const timeline = order.timeline || OrderEngine.buildTimeline(order);
        result.innerHTML = `
          <p class="form-message form-message--success">Order ${esc(order.id)} is ${esc(order.status)}.</p>
          <ol class="order-timeline">
            ${timeline
              .map(
                (t) => `<li class="order-timeline__step${t.complete ? ' is-complete' : ''}${t.current ? ' is-current' : ''}"><span class="order-timeline__dot"></span><span class="order-timeline__label">${esc(t.label)}</span></li>`
              )
              .join('')}
          </ol>
          <a href="order-detail.html?id=${encodeURIComponent(order.id)}" class="btn btn--pill btn--outline">View Details</a>
        `;
      });
    });
  }

  /* ============================ STORE LOCATOR ============================ */
  if (page === 'store-locator') {
    const list = document.getElementById('store-list');
    if (list && window.SiteConfig) {
      list.innerHTML = SiteConfig.STORES.map(
        (s) => `
        <article class="store-card">
          <h2 class="store-card__name">${esc(s.name)}</h2>
          <p class="store-card__city">${esc(s.city)}</p>
          <p class="store-card__address">${esc(s.address)}</p>
          <p class="store-card__hours">${esc(s.hours)}</p>
        </article>`
      ).join('');
    }
  }
})();
