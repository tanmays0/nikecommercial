/**
 * Shared form validation helpers.
 */
(function () {
  'use strict';

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function isValidEmail(email) {
    return EMAIL_RE.test(String(email || '').trim());
  }

  function luhnCheck(num) {
    const digits = String(num).replace(/\D/g, '');
    if (digits.length < 13) return false;
    let sum = 0;
    let alt = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let n = parseInt(digits[i], 10);
      if (alt) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alt = !alt;
    }
    return sum % 10 === 0;
  }

  function isValidCardExpiry(mmYY) {
    const parts = String(mmYY || '').split('/');
    if (parts.length !== 2) return false;
    const month = parseInt(parts[0], 10);
    const year = parseInt(parts[1], 10);
    if (month < 1 || month > 12 || Number.isNaN(year)) return false;
    const fullYear = year < 100 ? 2000 + year : year;
    const now = new Date();
    const expiry = new Date(fullYear, month);
    return expiry > now;
  }

  function setFieldError(form, field, msg) {
    const el = form.querySelector(`[data-error-for="${field}"]`);
    const input = form[field] || form.querySelector(`[name="${field}"]`);
    if (el) el.textContent = msg || '';
    if (input) input.classList.toggle('is-invalid', Boolean(msg));
  }

  function clearErrors(form) {
    form.querySelectorAll('[data-error-for]').forEach((el) => (el.textContent = ''));
    form.querySelectorAll('.is-invalid').forEach((el) => el.classList.remove('is-invalid'));
  }

  window.Validation = Object.freeze({
    isValidEmail,
    luhnCheck,
    isValidCardExpiry,
    setFieldError,
    clearErrors,
  });
})();
