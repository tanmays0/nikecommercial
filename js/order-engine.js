/**
 * ARCHIVE — Order engine (history, detail, status timeline)
 * Compatible with legacy 'nikecommercial_orders' storage; seeds mock history once.
 */
(function () {
  'use strict';

  const ORDERS_KEY = 'nikecommercial_orders';
  const SEED_FLAG = 'archive_orders_seeded';
  const EVENT_ORDERS = 'archiveOrdersUpdated';

  const STATUS_FLOW = ['Processing', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];

  function read() {
    try {
      const parsed = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function write(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent(EVENT_ORDERS, { detail: { orders } }));
  }

  function generateId() {
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `VA-${Date.now().toString(36).toUpperCase()}-${rand}`;
  }

  /**
   * @param {object} payload full order details from checkout
   */
  function createOrder(payload) {
    const order = {
      id: generateId(),
      date: new Date().toISOString(),
      status: 'Processing',
      statusIndex: 0,
      ...payload,
    };
    order.timeline = buildTimeline(order);
    const orders = read();
    orders.unshift(order);
    write(orders);
    return order;
  }

  function getOrders() {
    return read();
  }

  function getOrder(id) {
    return read().find((o) => o.id === id) || null;
  }

  function statusIndexFor(order) {
    if (typeof order.statusIndex === 'number') return order.statusIndex;
    const idx = STATUS_FLOW.indexOf(order.status);
    return idx < 0 ? 0 : idx;
  }

  function buildTimeline(order) {
    const activeIndex = statusIndexFor(order);
    const placed = new Date(order.date);
    return STATUS_FLOW.map((label, i) => {
      const stepDate = new Date(placed.getTime() + i * 24 * 60 * 60 * 1000);
      return {
        label,
        complete: i <= activeIndex,
        current: i === activeIndex,
        date: i <= activeIndex ? stepDate.toISOString() : null,
      };
    });
  }

  /* ---------- seed realistic past orders (once) ---------- */
  function seedIfEmpty() {
    if (localStorage.getItem(SEED_FLAG)) return;
    localStorage.setItem(SEED_FLAG, '1');

    if (read().length > 0) return;
    if (!window.ProductsData) return;

    const pool = window.ProductsData.RAW_PRODUCTS || [];
    if (!pool.length) return;

    const pick = (i) => pool[(i * 7) % pool.length];
    const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

    const seeds = [
      { statusIndex: 4, ago: 42, items: [0, 3] },
      { statusIndex: 4, ago: 21, items: [5] },
      { statusIndex: 2, ago: 4, items: [8, 12, 2] },
    ];

    const orders = seeds.map((seed, n) => {
      const lines = seed.items.map((i) => {
        const p = pick(i + n);
        return {
          productId: p.id,
          name: p.name,
          price: p.price,
          image: window.ProductSchema ? ProductSchema.getPrimaryImageUrl(p) : '',
          size: p.sizeValues?.[2] || p.sizeValues?.[0] || 'M',
          color: p.colorNames?.[0] || 'Black',
          quantity: 1,
        };
      });
      const totals = window.Pricing
        ? Pricing.summarize(lines)
        : { subtotal: 0, shipping: 0, tax: 0, total: 0 };
      const order = {
        id: generateId(),
        date: daysAgo(seed.ago),
        status: STATUS_FLOW[seed.statusIndex],
        statusIndex: seed.statusIndex,
        items: lines,
        totals,
        total: totals.total,
        shippingAddress: {
          name: 'Demo Athlete',
          line1: '120 Spring St',
          city: 'New York',
          state: 'NY',
          zip: '10012',
          country: 'USA',
        },
        payment: { brand: 'Visa', last4: '4242' },
      };
      order.timeline = buildTimeline(order);
      return order;
    });

    write(orders);
  }

  window.OrderEngine = Object.freeze({
    ORDERS_KEY,
    EVENT_ORDERS,
    STATUS_FLOW,
    createOrder,
    getOrders,
    getOrder,
    buildTimeline,
    statusIndexFor,
    seedIfEmpty,
  });

  seedIfEmpty();
})();
