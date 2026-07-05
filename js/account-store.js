/**
 * ARCHIVE — Account data (addresses, payment methods, preferences)
 * Namespaced per signed-in user email, persisted in localStorage.
 */
(function () {
  'use strict';

  const KEY = 'archive_account';

  function currentEmail() {
    return window.AuthEngine?.getSession()?.email || 'guest';
  }

  function readAll() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch (_) {
      return {};
    }
  }

  function writeAll(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function getScope() {
    const all = readAll();
    const email = currentEmail();
    if (!all[email]) {
      all[email] = defaultScope();
      writeAll(all);
    }
    return all[email];
  }

  function saveScope(scope) {
    const all = readAll();
    all[currentEmail()] = scope;
    writeAll(all);
  }

  function defaultScope() {
    return {
      addresses: [],
      paymentMethods: [],
      preferences: {
        emailPromotions: true,
        emailOrders: true,
        pushDrops: false,
        smsShipping: false,
      },
      settings: {
        currency: 'USD',
        language: 'en',
        theme: 'system',
      },
    };
  }

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  }

  /* ---------- addresses ---------- */
  function getAddresses() {
    return getScope().addresses;
  }

  function upsertAddress(address) {
    const scope = getScope();
    if (address.id) {
      const idx = scope.addresses.findIndex((a) => a.id === address.id);
      if (idx > -1) scope.addresses[idx] = { ...scope.addresses[idx], ...address };
    } else {
      address.id = uid('addr');
      if (scope.addresses.length === 0) address.isDefault = true;
      scope.addresses.push(address);
    }
    if (address.isDefault) {
      scope.addresses.forEach((a) => {
        a.isDefault = a.id === address.id;
      });
    }
    saveScope(scope);
    return scope.addresses;
  }

  function deleteAddress(id) {
    const scope = getScope();
    const wasDefault = scope.addresses.find((a) => a.id === id)?.isDefault;
    scope.addresses = scope.addresses.filter((a) => a.id !== id);
    if (wasDefault && scope.addresses[0]) scope.addresses[0].isDefault = true;
    saveScope(scope);
    return scope.addresses;
  }

  function setDefaultAddress(id) {
    const scope = getScope();
    scope.addresses.forEach((a) => {
      a.isDefault = a.id === id;
    });
    saveScope(scope);
    return scope.addresses;
  }

  /* ---------- payment methods (masked, mock) ---------- */
  function getPaymentMethods() {
    return getScope().paymentMethods;
  }

  function addPaymentMethod({ number, expiry, name, brand }) {
    const scope = getScope();
    const digits = String(number).replace(/\D/g, '');
    const method = {
      id: uid('pm'),
      brand: brand || detectBrand(digits),
      last4: digits.slice(-4),
      expiry,
      name,
      isDefault: scope.paymentMethods.length === 0,
    };
    scope.paymentMethods.push(method);
    saveScope(scope);
    return scope.paymentMethods;
  }

  function deletePaymentMethod(id) {
    const scope = getScope();
    const wasDefault = scope.paymentMethods.find((p) => p.id === id)?.isDefault;
    scope.paymentMethods = scope.paymentMethods.filter((p) => p.id !== id);
    if (wasDefault && scope.paymentMethods[0]) scope.paymentMethods[0].isDefault = true;
    saveScope(scope);
    return scope.paymentMethods;
  }

  function setDefaultPaymentMethod(id) {
    const scope = getScope();
    scope.paymentMethods.forEach((p) => {
      p.isDefault = p.id === id;
    });
    saveScope(scope);
    return scope.paymentMethods;
  }

  function detectBrand(digits) {
    if (/^4/.test(digits)) return 'Visa';
    if (/^5[1-5]/.test(digits)) return 'Mastercard';
    if (/^3[47]/.test(digits)) return 'Amex';
    if (/^6/.test(digits)) return 'Discover';
    return 'Card';
  }

  /* ---------- preferences + settings ---------- */
  function getPreferences() {
    return getScope().preferences;
  }
  function savePreferences(prefs) {
    const scope = getScope();
    scope.preferences = { ...scope.preferences, ...prefs };
    saveScope(scope);
    return scope.preferences;
  }
  function getSettings() {
    return getScope().settings;
  }
  function saveSettings(settings) {
    const scope = getScope();
    scope.settings = { ...scope.settings, ...settings };
    saveScope(scope);
    return scope.settings;
  }

  window.AccountStore = Object.freeze({
    getAddresses,
    upsertAddress,
    deleteAddress,
    setDefaultAddress,
    getPaymentMethods,
    addPaymentMethod,
    deletePaymentMethod,
    setDefaultPaymentMethod,
    detectBrand,
    getPreferences,
    savePreferences,
    getSettings,
    saveSettings,
  });
})();
