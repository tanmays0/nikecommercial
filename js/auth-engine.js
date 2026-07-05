/**
 * ARCHIVE — Mock auth engine (session + users store)
 */
(function () {
  'use strict';

  const SESSION_KEY = 'archive_session';
  const USERS_KEY = 'archive_users';
  const RESET_KEY = 'archive_reset_tokens';
  const EVENT_AUTH = 'archiveAuthChanged';

  /* ---------- storage helpers ---------- */
  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }
  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getUsers() {
    return readJson(USERS_KEY, {});
  }
  function saveUsers(users) {
    writeJson(USERS_KEY, users);
  }

  /* ---------- validation ---------- */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
  }

  function passwordIssues(password) {
    const issues = [];
    if (String(password || '').length < 8) issues.push('at least 8 characters');
    if (!/[0-9]/.test(password)) issues.push('a number');
    if (!/[A-Za-z]/.test(password)) issues.push('a letter');
    return issues;
  }

  /* ---------- session ---------- */
  function getSession() {
    return readJson(SESSION_KEY, null);
  }

  function isLoggedIn() {
    return Boolean(getSession());
  }

  function setSession(user) {
    const session = { email: user.email, name: user.name, loginAt: Date.now() };
    writeJson(SESSION_KEY, session);
    dispatch();
    return session;
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
    dispatch();
  }

  function dispatch() {
    window.dispatchEvent(new CustomEvent(EVENT_AUTH, { detail: { session: getSession() } }));
  }

  /* ---------- auth actions (return Promises via MockService) ---------- */
  function hash(str) {
    // NOT secure — mock only. Obfuscates password in localStorage.
    let h = 0;
    for (let i = 0; i < str.length; i += 1) {
      h = (h << 5) - h + str.charCodeAt(i);
      h |= 0;
    }
    return `h${h}`;
  }

  function register({ name, email, password }) {
    return svc(() => {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!name || name.trim().length < 2) throw fieldError('name', 'Enter your name.');
      if (!isValidEmail(cleanEmail)) throw fieldError('email', 'Enter a valid email address.');
      const pwIssues = passwordIssues(password);
      if (pwIssues.length) throw fieldError('password', `Password needs ${pwIssues.join(', ')}.`);

      const users = getUsers();
      if (users[cleanEmail]) throw fieldError('email', 'An account with this email already exists.');

      users[cleanEmail] = {
        name: name.trim(),
        email: cleanEmail,
        password: hash(password),
        createdAt: new Date().toISOString(),
      };
      saveUsers(users);
      return setSession(users[cleanEmail]);
    });
  }

  function login({ email, password }) {
    return svc(() => {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!isValidEmail(cleanEmail)) throw fieldError('email', 'Enter a valid email address.');
      if (!password) throw fieldError('password', 'Enter your password.');

      const users = getUsers();
      const user = users[cleanEmail];

      // Demo convenience: allow login for a known demo account or any registered user.
      if (cleanEmail === 'demo@archive.market' && password === 'Archive1') {
        return setSession({ name: 'Demo Collector', email: cleanEmail });
      }

      if (!user || user.password !== hash(password)) {
        throw fieldError('password', 'Email or password is incorrect.');
      }
      return setSession(user);
    });
  }

  function requestPasswordReset({ email }) {
    return svc(() => {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!isValidEmail(cleanEmail)) throw fieldError('email', 'Enter a valid email address.');
      const token = Math.random().toString(36).slice(2, 8).toUpperCase();
      const tokens = readJson(RESET_KEY, {});
      tokens[cleanEmail] = token;
      writeJson(RESET_KEY, tokens);
      // Simulated email — surface token so the reset page flow is testable.
      return { email: cleanEmail, token };
    });
  }

  function resetPassword({ email, token, password }) {
    return svc(() => {
      const cleanEmail = String(email).trim().toLowerCase();
      const pwIssues = passwordIssues(password);
      if (pwIssues.length) throw fieldError('password', `Password needs ${pwIssues.join(', ')}.`);
      const tokens = readJson(RESET_KEY, {});
      if (token && tokens[cleanEmail] && tokens[cleanEmail] !== String(token).toUpperCase()) {
        throw fieldError('token', 'Reset code is invalid or expired.');
      }
      const users = getUsers();
      if (users[cleanEmail]) {
        users[cleanEmail].password = hash(password);
        saveUsers(users);
      }
      delete tokens[cleanEmail];
      writeJson(RESET_KEY, tokens);
      return { email: cleanEmail };
    });
  }

  function updateProfile({ name, email }) {
    return svc(() => {
      const session = getSession();
      if (!session) throw new Error('Not signed in.');
      if (!name || name.trim().length < 2) throw fieldError('name', 'Enter your name.');
      const users = getUsers();
      const record = users[session.email];
      if (record) {
        record.name = name.trim();
        saveUsers(users);
      }
      return setSession({ name: name.trim(), email: session.email });
    });
  }

  function fieldError(field, message) {
    const err = new Error(message);
    err.field = field;
    return err;
  }

  function svc(producer) {
    if (window.MockService) return MockService.request(producer, { min: 320, max: 780 });
    return new Promise((resolve, reject) => {
      try {
        resolve(producer());
      } catch (e) {
        reject(e);
      }
    });
  }

  window.AuthEngine = Object.freeze({
    EVENT_AUTH,
    SESSION_KEY,
    isValidEmail,
    passwordIssues,
    getSession,
    isLoggedIn,
    logout,
    register,
    login,
    requestPasswordReset,
    resetPassword,
    updateProfile,
  });
})();
