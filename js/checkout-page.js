/**
 * ARCHIVE — Multi-step checkout (shipping → payment → review)
 * Per-step validation, live totals, coupon, tax + shipping, simulated payment.
 */
(function () {
  'use strict';

  if (!window.CartEngine) return;

  const form = document.getElementById('checkout-form');
  if (!form) return;

  if (CartEngine.getCartCount() === 0) {
    window.location.href = 'cart.html';
    return;
  }

  const steps = document.querySelectorAll('[data-checkout-step]');
  const panels = document.querySelectorAll('[data-checkout-panel]');
  const summaryItemsEl = document.getElementById('checkout-summary-items');
  const summaryRowsEl = document.getElementById('checkout-summary-rows');
  const summaryTotalEl = document.getElementById('checkout-summary-total');
  const reviewEl = document.getElementById('checkout-review');
  const messageEl = document.getElementById('checkout-message');
  const placeBtn = document.getElementById('place-order-btn');

  let currentStep = 1;
  let appliedCoupon = null; // { code, coupon, discount }

  const money = (n) => (window.Format ? Format.money(n) : `$${n}`);
  const esc = (s) => (window.Dom ? Dom.escapeHtml(s) : String(s));

  /* ---------- prefill from session / saved address ---------- */
  function prefill() {
    const session = window.AuthEngine?.getSession();
    if (session) {
      if (form.name && !form.name.value) form.name.value = session.name || '';
      if (form.email && !form.email.value) form.email.value = session.email || '';
    }
    const addresses = window.AccountStore?.getAddresses() || [];
    const def = addresses.find((a) => a.isDefault) || addresses[0];
    if (def) {
      setIfEmpty('name', def.name);
      setIfEmpty('address', def.line1);
      setIfEmpty('city', def.city);
      setIfEmpty('state', def.state);
      setIfEmpty('zip', def.zip);
      setIfEmpty('country', def.country);
    }
  }
  function setIfEmpty(field, val) {
    if (form[field] && !form[field].value && val) form[field].value = val;
  }

  /* ---------- step navigation ---------- */
  function showStep(step) {
    currentStep = step;
    steps.forEach((el) => {
      const n = Number(el.dataset.checkoutStep);
      el.classList.toggle('is-active', n === step);
      el.classList.toggle('is-complete', n < step);
    });
    panels.forEach((el) => {
      el.hidden = Number(el.dataset.checkoutPanel) !== step;
    });
    if (step === 3) renderReview();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- validation ---------- */
  function setError(field, msg) {
    if (window.Validation) Validation.setFieldError(form, field, msg);
    else {
      const small = form.querySelector(`[data-error-for="${field}"]`);
      const input = form[field];
      if (small) small.textContent = msg || '';
      if (input) input.classList.toggle('is-invalid', Boolean(msg));
    }
    return !msg;
  }

  function validateShipping() {
    let ok = true;
    const required = ['name', 'email', 'address', 'city', 'state', 'zip', 'country'];
    required.forEach((f) => {
      const val = form[f]?.value.trim();
      ok = setError(f, val ? '' : 'Required') && ok;
    });
    if (form.email.value && !(window.Validation ? Validation.isValidEmail(form.email.value) : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim()))) {
      ok = setError('email', 'Enter a valid email') && ok;
    }
    if (form.zip.value && !/^\d{4,6}$/.test(form.zip.value.trim())) {
      ok = setError('zip', 'Enter a valid ZIP') && ok;
    }
    return ok;
  }

  function luhnValid(number) {
    return window.Validation ? Validation.luhnCheck(number) : false;
  }

  function validatePayment() {
    let ok = true;
    ok = setError('cardName', form.cardName.value.trim() ? '' : 'Required') && ok;

    const num = form.cardNumber.value.replace(/\s/g, '');
    if (!num) ok = setError('cardNumber', 'Required') && ok;
    else if (!luhnValid(num)) ok = setError('cardNumber', 'Invalid card number') && ok;
    else setError('cardNumber', '');

    const exp = form.cardExpiry.value.trim();
    const expMatch = exp.match(/^(\d{2})\/(\d{2})$/);
    if (!expMatch) {
      ok = setError('cardExpiry', 'Use MM/YY') && ok;
    } else {
      const mm = Number(expMatch[1]);
      const yy = Number(expMatch[2]) + 2000;
      const now = new Date();
      const expDate = new Date(yy, mm);
      if (mm < 1 || mm > 12) ok = setError('cardExpiry', 'Invalid month') && ok;
      else if (expDate <= now) ok = setError('cardExpiry', 'Card expired') && ok;
      else setError('cardExpiry', '');
    }

    const cvc = form.cardCvc.value.trim();
    ok = setError('cardCvc', /^\d{3,4}$/.test(cvc) ? '' : '3–4 digits') && ok;

    return ok;
  }

  /* ---------- card formatting ---------- */
  function initCardFormatting() {
    const numberInput = form.cardNumber;
    const expiryInput = form.cardExpiry;
    const cvcInput = form.cardCvc;
    const brandEl = document.getElementById('card-brand');

    numberInput?.addEventListener('input', () => {
      const digits = numberInput.value.replace(/\D/g, '').slice(0, 16);
      numberInput.value = digits.replace(/(.{4})/g, '$1 ').trim();
      if (brandEl && window.AccountStore) {
        brandEl.textContent = digits.length >= 2 ? AccountStore.detectBrand(digits) : '';
      }
    });

    expiryInput?.addEventListener('input', () => {
      let digits = expiryInput.value.replace(/\D/g, '').slice(0, 4);
      if (digits.length >= 3) digits = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      expiryInput.value = digits;
    });

    cvcInput?.addEventListener('input', () => {
      cvcInput.value = cvcInput.value.replace(/\D/g, '').slice(0, 4);
    });
  }

  /* ---------- totals + summary ---------- */
  function shippingMethod() {
    return form.shipping?.value || 'standard';
  }

  function currentSummary() {
    const discount = appliedCoupon ? appliedCoupon.discount : 0;
    let summary = CartEngine.getSummary({ method: shippingMethod(), discount });
    // free-shipping coupon overrides shipping cost
    if (appliedCoupon && window.CouponEngine?.affectsShipping(appliedCoupon.coupon)) {
      const newTotal = Pricing.round(summary.total - summary.shipping);
      summary = { ...summary, shipping: 0, total: newTotal };
    }
    return summary;
  }

  function renderSummary() {
    const cart = CartEngine.getCart();
    if (summaryItemsEl) {
      summaryItemsEl.innerHTML = cart
        .map(
          (item) => `
        <li class="checkout-summary__item">
          <span class="checkout-summary__item-name">${esc(item.name)} <em>× ${item.quantity}</em></span>
          <span>${money(item.price * item.quantity)}</span>
        </li>`
        )
        .join('');
    }

    const s = currentSummary();
    if (summaryRowsEl) {
      const rows = [`<div class="cart-summary-row"><dt>Subtotal</dt><dd>${money(s.subtotal)}</dd></div>`];
      if (s.discount > 0) {
        rows.push(
          `<div class="cart-summary-row cart-summary-row--discount"><dt>Discount${
            appliedCoupon ? ` (${esc(appliedCoupon.code)})` : ''
          }</dt><dd>−${money(s.discount)}</dd></div>`
        );
      }
      rows.push(
        `<div class="cart-summary-row"><dt>Shipping</dt><dd>${s.shipping === 0 ? 'Free' : money(s.shipping)}</dd></div>`
      );
      rows.push(`<div class="cart-summary-row"><dt>Tax</dt><dd>${money(s.tax)}</dd></div>`);
      summaryRowsEl.innerHTML = rows.join('');
    }
    if (summaryTotalEl) summaryTotalEl.textContent = money(s.total);
  }

  function renderReview() {
    if (!reviewEl) return;
    const s = currentSummary();
    reviewEl.innerHTML = `
      <div class="checkout-review__block">
        <h3>Ship To</h3>
        <p>${esc(form.name.value)}<br>${esc(form.address.value)}<br>${esc(form.city.value)}, ${esc(form.state.value)} ${esc(form.zip.value)}<br>${esc(form.country.value)}</p>
        <button type="button" class="checkout-review__edit" data-goto="1">Edit</button>
      </div>
      <div class="checkout-review__block">
        <h3>Payment</h3>
        <p>${esc(document.getElementById('card-brand')?.textContent || 'Card')} ending ${esc(form.cardNumber.value.replace(/\s/g, '').slice(-4))}</p>
        <button type="button" class="checkout-review__edit" data-goto="2">Edit</button>
      </div>
      <div class="checkout-review__block">
        <h3>Shipping</h3>
        <p>${shippingMethod() === 'expedited' ? 'Expedited (1–2 days)' : 'Standard (3–5 days)'} — ${s.shipping === 0 ? 'Free' : money(s.shipping)}</p>
      </div>
    `;
    reviewEl.querySelectorAll('[data-goto]').forEach((btn) => {
      btn.addEventListener('click', () => showStep(Number(btn.dataset.goto)));
    });
  }

  /* ---------- coupon ---------- */
  function initCoupon() {
    const couponForm = document.getElementById('coupon-form');
    const couponMsg = document.getElementById('coupon-message');
    if (!couponForm) return;

    // restore previously applied
    const saved = window.CouponEngine?.getApplied();
    if (saved) {
      const res = CouponEngine.validate(saved.code, CartEngine.getSubtotal());
      if (res.ok) {
        appliedCoupon = res;
        document.getElementById('coupon-input').value = res.code;
        showCoupon(couponMsg, res.message, 'success');
      }
    }

    couponForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = document.getElementById('coupon-input').value;
      const res = CouponEngine.validate(code, CartEngine.getSubtotal());
      if (res.ok) {
        appliedCoupon = res;
        CouponEngine.setApplied(res.code);
        showCoupon(couponMsg, res.message, 'success');
      } else {
        appliedCoupon = null;
        CouponEngine.clear();
        showCoupon(couponMsg, res.message, 'error');
      }
      renderSummary();
      if (currentStep === 3) renderReview();
    });
  }

  function showCoupon(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    el.className = `coupon-message coupon-message--${type}`;
  }

  /* ---------- place order (simulated payment) ---------- */
  function placeOrder() {
    if (!validateShipping()) {
      showStep(1);
      return;
    }
    if (!validatePayment()) {
      showStep(2);
      return;
    }

    const cardDigits = form.cardNumber.value.replace(/\D/g, '');
    placeBtn.disabled = true;
    placeBtn.textContent = 'Processing…';
    showMessage('', null);

    const process = () => {
      // Simulated decline: known success card always passes; otherwise odd last digit declines.
      const isKnownSuccess = cardDigits === '4242424242424242';
      const lastDigit = Number(cardDigits.slice(-1));
      const declined = !isKnownSuccess && lastDigit % 2 === 1;
      if (declined) {
        const err = new Error('Your card was declined. Try 4242 4242 4242 4242.');
        err.declined = true;
        throw err;
      }
      return true;
    };

    const svc = window.MockService
      ? MockService.request(process, { min: 900, max: 1600 })
      : new Promise((res, rej) => {
          try {
            res(process());
          } catch (e) {
            rej(e);
          }
        });

    svc
      .then(() => {
        const s = currentSummary();
        const order = {
          items: CartEngine.getCart(),
          totals: s,
          total: s.total,
          coupon: appliedCoupon ? appliedCoupon.code : null,
          shippingMethod: shippingMethod(),
          shippingAddress: {
            name: form.name.value,
            line1: form.address.value,
            city: form.city.value,
            state: form.state.value,
            zip: form.zip.value,
            country: form.country.value,
          },
          email: form.email.value,
          payment: {
            brand: document.getElementById('card-brand')?.textContent || 'Card',
            last4: cardDigits.slice(-4),
          },
        };
        const created = window.OrderEngine ? OrderEngine.createOrder(order) : { id: `VA-${Date.now()}` };
        CartEngine.clearCart();
        if (window.CouponEngine) CouponEngine.clear();
        window.location.href = `order-confirmation.html?id=${encodeURIComponent(created.id)}`;
      })
      .catch((err) => {
        placeBtn.disabled = false;
        placeBtn.textContent = 'Place Order';
        showMessage(err.message, 'error');
        if (err.declined) showStep(2);
      });
  }

  function showMessage(text, type) {
    if (!messageEl) return;
    messageEl.textContent = text;
    messageEl.hidden = !text;
    messageEl.className = type ? `form-message form-message--${type}` : 'form-message';
    if (!messageEl.hasAttribute('role')) messageEl.setAttribute('role', 'alert');
    if (!messageEl.hasAttribute('aria-live')) messageEl.setAttribute('aria-live', 'polite');
    if (text && window.Dom) Dom.announce(text, type === 'error' ? 'assertive' : 'polite');
  }

  /* ---------- wiring ---------- */
  document.querySelectorAll('[data-checkout-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (currentStep === 1 && !validateShipping()) return;
      if (currentStep === 2 && !validatePayment()) return;
      if (currentStep < 3) showStep(currentStep + 1);
    });
  });

  document.querySelectorAll('[data-checkout-back]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (currentStep > 1) showStep(currentStep - 1);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    placeOrder();
  });

  form.querySelectorAll('[name="shipping"]').forEach((r) =>
    r.addEventListener('change', () => {
      renderSummary();
      if (currentStep === 3) renderReview();
    })
  );

  prefill();
  initCardFormatting();
  initCoupon();
  renderSummary();
  showStep(1);
})();
