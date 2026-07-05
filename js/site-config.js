/**
 * ARCHIVE — Site IA, navigation, collections, and page content registry
 */
(function () {
  'use strict';

  const PRODUCT_TAGS = {};

  const SALE_PRICES = {};

  const COLLECTIONS = [
    {
      slug: 'city-uniform',
      title: 'The City Uniform',
      eyebrow: 'Collection',
      description:
        'The everyday rotation, reconsidered. Broken-in silhouettes and quiet staples sourced from a decade of street style — each piece one of one.',
      heroImage: 'assets/images/air-max-pulse.jpg',
      productIds: ['archive-air-max-pulse', 'archive-air-max-90', 'archive-dunk-low', 'archive-tech-fleece-jogger'],
    },
    {
      slug: 'the-distance',
      title: 'Built for the Distance',
      eyebrow: 'Collection',
      description:
        'Archival running icons and lived-in technical layers. Foam that has already found its stride, graded and ready for many more miles.',
      heroImage: 'assets/images/essentials-men.jpg',
      productIds: ['archive-pegasus-premium', 'archive-vomero-17', 'archive-dri-fit-adv-top', 'archive-running-belt'],
    },
    {
      slug: 'hardwood',
      title: 'Hardwood Heritage',
      eyebrow: 'Collection',
      description:
        'Court-born profiles with a story to tell. Authenticated hoops classics and warm-up essentials, scuffs and character included.',
      heroImage: 'assets/images/air-max-1.jpg',
      productIds: ['archive-dunk-low', 'archive-basketball-short', 'archive-brasilia-duffel', 'archive-star-runner-4'],
    },
    {
      slug: 'the-air-index',
      title: 'The Air Index',
      eyebrow: 'Collection',
      description:
        'A survey of visible-air icons across the eras — from 90s originals to Y2K statements. Every pair verified, graded, and photographed by hand.',
      heroImage: 'assets/images/air-max-dn.jpg',
      productIds: ['archive-air-max-dn', 'archive-air-max-97', 'archive-air-max-plus', 'archive-air-max-1'],
    },
  ];

  const STORES = [
    { id: 'nyc-soho', name: 'ARCHIVE Showroom — SoHo', city: 'New York', address: '120 Spring St, New York, NY 10012', hours: 'Mon–Sat 10–8 · Sun 11–7' },
    { id: 'la-melrose', name: 'ARCHIVE Showroom — Melrose', city: 'Los Angeles', address: '8500 Melrose Ave, West Hollywood, CA 90069', hours: 'Mon–Sat 10–8 · Sun 11–7' },
    { id: 'chi-michigan', name: 'ARCHIVE Showroom — Michigan Ave', city: 'Chicago', address: '669 N Michigan Ave, Chicago, IL 60611', hours: 'Mon–Sat 10–8 · Sun 11–6' },
    { id: 'lon-oxford', name: 'ARCHIVE Showroom — Shoreditch', city: 'London', address: '12 Redchurch St, London E2 7DP', hours: 'Mon–Sat 10–8 · Sun 12–6' },
    { id: 'tok-shibuya', name: 'ARCHIVE Showroom — Shibuya', city: 'Tokyo', address: '1-17-1 Jinnan, Shibuya City, Tokyo', hours: 'Daily 10–9' },
  ];

  const NAV = {
    primary: [
      { label: 'New', href: 'new-arrivals.html' },
      { label: 'Men', href: 'shop-men.html' },
      { label: 'Women', href: 'shop-women.html' },
      { label: 'Kids', href: 'shop-kids.html' },
      { label: 'Sale', href: 'sale.html' },
    ],
    shop: [
      { label: 'All Products', href: 'shop.html' },
      { label: 'New Arrivals', href: 'new-arrivals.html' },
      { label: 'Best Sellers', href: 'best-sellers.html' },
      { label: 'Trending', href: 'trending.html' },
      { label: 'Featured', href: 'featured.html' },
      { label: 'Sale', href: 'sale.html' },
    ],
    categories: [
      { label: "Men's", href: 'shop-men.html' },
      { label: "Women's", href: 'shop-women.html' },
      { label: "Kids'", href: 'shop-kids.html' },
      { label: 'Accessories', href: 'shop-accessories.html' },
    ],
    lines: [
      { label: 'Running', href: 'running.html' },
      { label: 'Training', href: 'training.html' },
      { label: 'Basketball', href: 'basketball.html' },
      { label: 'Lifestyle', href: 'lifestyle.html' },
      { label: 'Jordan', href: 'jordan.html' },
      { label: 'Air Max', href: 'air-max.html' },
    ],
    collections: COLLECTIONS.map((c) => ({ label: c.title, href: `collection.html?slug=${c.slug}` })),
    discover: [
      { label: 'Search', href: 'search.html' },
      { label: 'Store Locator', href: 'store-locator.html' },
      { label: 'Recently Viewed', href: 'recently-viewed.html' },
      { label: 'Compare Products', href: 'compare.html' },
    ],
    account: [
      { label: 'Sign In', href: 'login.html' },
      { label: 'Create Account', href: 'register.html' },
      { label: 'Orders', href: 'orders.html' },
      { label: 'Wishlist', href: 'wishlist.html' },
      { label: 'Profile', href: 'profile.html' },
    ],
  };

  const FOOTER = [
    {
      heading: 'Shop',
      links: [
        { label: 'All Products', href: 'shop.html' },
        { label: 'New Arrivals', href: 'new-arrivals.html' },
        { label: 'Best Sellers', href: 'best-sellers.html' },
        { label: 'Trending', href: 'trending.html' },
        { label: 'Collections', href: 'collections.html' },
        { label: 'Sale', href: 'sale.html' },
        { label: 'Gift Cards', href: 'gift-cards.html' },
      ],
    },
    {
      heading: 'Help',
      links: [
        { label: 'Support', href: 'support.html' },
        { label: 'FAQs', href: 'faqs.html' },
        { label: 'Order Status', href: 'order-tracking.html' },
        { label: 'Shipping', href: 'shipping-info.html' },
        { label: 'Returns', href: 'returns-policy.html' },
        { label: 'Contact', href: 'contact.html' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About', href: 'about.html' },
        { label: 'Sustainability', href: 'sustainability.html' },
        { label: 'Careers', href: 'careers.html' },
        { label: 'Store Locator', href: 'store-locator.html' },
        { label: 'Accessibility', href: 'accessibility.html' },
      ],
    },
    {
      heading: 'Account',
      links: [
        { label: 'Sign In', href: 'login.html' },
        { label: 'Register', href: 'register.html' },
        { label: 'Wishlist', href: 'wishlist.html' },
        { label: 'Orders', href: 'orders.html' },
        { label: 'Settings', href: 'settings.html' },
      ],
    },
  ];

  const CATALOG_PAGES = {
    shop: {
      title: 'Shop All',
      eyebrow: 'The Archive',
      lead: 'The full archive — authenticated vintage and pre-loved pieces across every category. Each listing is a single, hand-graded unit.',
      filter: () => true,
    },
    'new-arrivals': {
      title: 'New Arrivals',
      eyebrow: 'Just Landed',
      lead: 'Freshly sourced and newly authenticated. The latest finds added to the archive this week.',
      filter: (p) => p.isNew,
    },
    'best-sellers': {
      title: 'Most Wanted',
      eyebrow: 'In Demand',
      lead: 'The pieces our community watches, saves, and snaps up first.',
      filter: (p) => p.isBestSeller,
    },
    trending: {
      title: 'Trending Now',
      eyebrow: 'Momentum',
      lead: 'The eras and silhouettes moving fastest right now across resale.',
      filter: (p) => p.isTrending === true || p.tags.includes('trending'),
    },
    sale: {
      title: 'Sale',
      eyebrow: 'Reduced',
      lead: 'Archive pieces at a new price. One of each — once it is gone, it is gone.',
      filter: (p) => p.isOnSale === true || (p.compareAtPrice && p.compareAtPrice > p.price) || p.tags.includes('sale'),
    },
    featured: {
      title: 'Featured',
      eyebrow: 'Curators\u2019 Pick',
      lead: 'Hand-selected standouts and grails, chosen by the ARCHIVE curation team.',
      filter: (p) => p.isFeatured === true || p.tags.includes('featured'),
    },
    running: {
      title: 'Running',
      eyebrow: 'Category',
      lead: 'Archival runners and technical layers with real miles and real character.',
      filter: (p) => p.brandLine === 'Running' || p.tags.includes('running'),
    },
    training: {
      title: 'Training',
      eyebrow: 'Category',
      lead: 'Broken-in gym staples and studio pieces, graded and ready to wear.',
      filter: (p) => p.brandLine === 'Training' || p.tags.includes('training'),
    },
    basketball: {
      title: 'Basketball',
      eyebrow: 'Category',
      lead: 'Court-born silhouettes and warm-up gear with a story on every panel.',
      filter: (p) => p.brandLine === 'Basketball' || p.tags.includes('basketball'),
    },
    lifestyle: {
      title: 'Lifestyle',
      eyebrow: 'Category',
      lead: 'Everyday icons and vintage staples for the daily rotation.',
      filter: (p) => p.brandLine === 'Lifestyle' || p.tags.includes('lifestyle'),
    },
    jordan: {
      title: 'Jordan',
      eyebrow: 'Category',
      lead: 'Authenticated Jordan heritage — retros and classics, verified pair by pair.',
      filter: (p) => p.brandLine === 'Jordan' || p.tags.includes('jordan'),
    },
    'air-max': {
      title: 'Air Max',
      eyebrow: 'Category',
      lead: 'Visible-air icons across the eras, from 90s originals to Y2K statements.',
      filter: (p) => p.brandLine === 'Air Max' || p.tags.includes('air-max'),
    },
  };

  const CONTENT_PAGES = {
    about: {
      title: 'About ARCHIVE',
      sections: [
        { heading: 'Our Story', body: 'ARCHIVE is an independent, curated marketplace for authenticated vintage and pre-loved fashion. We source characterful pieces across the best of sportswear, workwear, and outerwear, then grade, photograph, and list each one individually — a single unit with a history, ready for its next owner.' },
        { heading: 'Authentication', body: 'Every item passes a multi-point inspection by our specialists — construction, materials, hardware, labeling, and wear are all reviewed before a piece is marked Authenticated. If we cannot verify it, we will not list it.' },
        { heading: 'Condition & Grading', body: 'We grade honestly: Like New, Excellent, Good, or Fair. Every listing includes real, unretouched photography of the actual item so you know exactly what you are buying — flaws, patina, and all.' },
        { heading: 'Independent Marketplace', body: 'ARCHIVE is not affiliated with, authorized by, or endorsed by any of the brands sold on this site. All trademarks and brand names belong to their respective owners; we simply give great pieces a second life.' },
      ],
    },
    contact: {
      title: 'Contact Us',
      sections: [
        { heading: 'Customer Care', body: 'Email help@archive.market or call 1-800-555-0199. Live chat is available Mon–Fri, 8am–8pm ET.' },
        { heading: 'Sell With Us', body: 'Have a piece worth passing on? Email consign@archive.market to start a consignment or direct-buy submission.' },
        { heading: 'Press & Partnerships', body: 'For media inquiries, contact press@archive.market.' },
        { heading: 'Visit Us', body: 'Find an ARCHIVE Showroom on our Store Locator page to view select pieces and collect in person.' },
      ],
    },
    faqs: {
      title: 'Frequently Asked Questions',
      sections: [
        { heading: 'Are items authentic?', body: 'Yes. Every piece is inspected and verified by our authentication team before listing. Items that pass carry an Authenticated badge on the product page.' },
        { heading: 'Why is each item one of a kind?', body: 'These are pre-owned pieces, not new stock. Most listings are a single physical unit in one size — once it sells, it is gone.' },
        { heading: 'What do the condition grades mean?', body: 'Like New shows little to no wear; Excellent has minimal signs of use; Good is gently worn with minor flaws; Fair is well-loved with visible character. Every listing shows photos of the actual item.' },
        { heading: 'Can I return a pre-owned item?', body: 'Yes — see our Returns Policy. Because condition is described and photographed up front, returns are accepted for items that arrive not as described within 14 days.' },
        { heading: 'How do sizes work?', body: 'Each listing shows the single size of that specific piece, with measurements where available. Consult the Size Guide and always check the listed condition notes.' },
      ],
    },
    'shipping-info': {
      title: 'Shipping Information',
      sections: [
        { heading: 'Standard Shipping', body: 'Free on orders over $50. Delivery in 3–5 business days via tracked ground service. Each piece is inspected once more before it ships.' },
        { heading: 'Express Shipping', body: '$15 flat rate. Delivery in 1–2 business days where available.' },
        { heading: 'Showroom Collection', body: 'Select ARCHIVE Showrooms offer buy-online, collect-in-person for eligible pieces, usually within 2 hours.' },
      ],
    },
    'returns-policy': {
      title: 'Returns Policy',
      sections: [
        { heading: 'As-Described Guarantee', body: 'Every item is pre-owned and sold as-is, with condition graded and photographed in the listing. If a piece arrives materially not as described, you are covered.' },
        { heading: 'Timeline', body: 'Initiate a return within 14 days of delivery. Items must be returned in the same condition received, with any ARCHIVE authentication tags still attached.' },
        { heading: 'Process', body: 'Start a return from Order History or contact Care. We review the item on arrival and issue a refund to your original payment method once condition is confirmed.' },
      ],
    },
    'privacy-policy': {
      title: 'Privacy Policy',
      sections: [
        { heading: 'Data We Collect', body: 'Account information, order history, and site usage analytics to improve your experience.' },
        { heading: 'How We Use Data', body: 'To fulfill orders, personalize recommendations, and communicate service updates. We do not sell personal data.' },
        { heading: 'Your Choices', body: 'Manage notification preferences in Account Settings. Request data export or deletion via privacy@archive.market.' },
      ],
    },
    'terms-of-service': {
      title: 'Terms of Service',
      sections: [
        { heading: 'Use of Site', body: 'This is a portfolio concept marketplace. Purchases are simulated for demonstration purposes.' },
        { heading: 'Resale & Trademarks', body: 'ARCHIVE resells pre-owned goods and is not affiliated with or endorsed by the brands listed. All brand names and trademarks belong to their respective owners.' },
        { heading: 'Product Information', body: 'We strive for accuracy in condition descriptions, grading, and pricing. Occasional errors may be corrected without notice.' },
        { heading: 'Limitation of Liability', body: 'ARCHIVE is provided as-is for educational and portfolio demonstration.' },
      ],
    },
    'gift-cards': {
      title: 'Gift Cards',
      sections: [
        { heading: 'Digital Gift Cards', body: 'Send instantly via email in denominations from $25 to $500. Never expires.' },
        { heading: 'Redemption', body: 'Apply your code at checkout. Gift cards may be combined with promotional offers unless stated otherwise.' },
        { heading: 'Balance Check', body: 'Check your remaining balance in Account → Payment Methods after signing in.' },
      ],
    },
    sustainability: {
      title: 'Sustainability',
      sections: [
        { heading: 'Circular by Default', body: 'Resale is our whole model. Every piece we authenticate is one kept out of landfill and in circulation — extending the life of clothing already made.' },
        { heading: 'Considered Logistics', body: 'We reuse and recycle packaging wherever possible and consolidate shipments to reduce the footprint of each order.' },
        { heading: 'Transparency', body: 'We report annually on volume diverted from waste and the estimated impact avoided by keeping garments in use.' },
      ],
    },
    careers: {
      title: 'Careers',
      sections: [
        { heading: 'Join the Team', body: 'We are hiring across engineering, design, authentication, and studio operations. Remote-friendly roles available.' },
        { heading: 'Culture', body: 'We value curators, makers, and storytellers who care about craft, provenance, and the details.' },
        { heading: 'Open Roles', body: 'Email careers@archive.market with your portfolio or LinkedIn. Include the role you are pursuing in the subject line.' },
      ],
    },
    accessibility: {
      title: 'Accessibility Statement',
      sections: [
        { heading: 'Commitment', body: 'We aim to meet WCAG 2.1 AA across our digital experiences, including keyboard navigation, focus states, and reduced-motion alternatives.' },
        { heading: 'Feedback', body: 'Encounter a barrier? Email accessibility@archive.market and we will respond within 2 business days.' },
        { heading: 'Assistive Technology', body: 'Our marketplace supports screen readers, voice control, and OS-level display preferences including prefers-reduced-motion.' },
      ],
    },
    'size-guide': {
      title: 'Size Guide',
      sections: [
        { heading: 'Read the Listing First', body: 'Vintage sizing runs differently by brand and era. Each listing shows the single size of that specific piece — check any measurements and condition notes before buying.' },
        { heading: 'Footwear', body: 'Older models can run a half size large or small. When measurements are provided, compare against a pair you already own.' },
        { heading: 'Apparel', body: 'Vintage cuts vary widely. Where garment measurements (chest, length, waist) are listed, use those over the labeled size.' },
      ],
    },
  };

  function getProductTags(productId) {
    const p = window.ProductsData?.getRawProductById(productId);
    if (!p) return { lines: [] };
    return {
      new: p.isNew,
      bestseller: p.isBestSeller,
      trending: p.isTrending === true || p.tags.includes('trending'),
      featured: p.isFeatured === true || p.tags.includes('featured'),
      sale: p.isOnSale === true || Boolean(p.compareAtPrice && p.compareAtPrice > p.price),
      lines: [window.ProductSchema?.getBrandLineSlug(p) || 'lifestyle'],
    };
  }

  function getSalePrice(productId) {
    const p = window.ProductsData?.getRawProductById(productId);
    if (!p || !window.ProductSchema?.isOnSale(p)) return null;
    return p.price;
  }

  function getEffectivePrice(product) {
    return product?.price ?? 0;
  }

  function getCatalogProducts(catalogId) {
    if (!window.ProductsData || !window.ProductSchema) return [];
    const page = CATALOG_PAGES[catalogId];
    if (!page) return [];
    return ProductsData.RAW_PRODUCTS.filter((p) => page.filter(p)).map(ProductsData.withLegacyView);
  }

  function getLineProducts(lineId) {
    return getCatalogProducts(lineId);
  }

  function getCollectionBySlug(slug) {
    return COLLECTIONS.find((c) => c.slug === slug) || null;
  }

  function getCollectionProducts(slug) {
    const collection = getCollectionBySlug(slug);
    if (!collection || !window.ProductsData) return [];

    const byField = window.ProductsData.RAW_PRODUCTS.filter(
      (p) => Array.isArray(p.collectionIds) && p.collectionIds.includes(slug)
    ).map(window.ProductsData.withLegacyView);

    if (byField.length) return byField;

    return (collection.productIds || [])
      .map((id) => window.ProductsData.getProductById(id))
      .filter(Boolean);
  }

  function getContentPage(pageId) {
    return CONTENT_PAGES[pageId] || null;
  }

  window.SiteConfig = Object.freeze({
    NAV,
    FOOTER,
    COLLECTIONS,
    STORES,
    CATALOG_PAGES,
    CONTENT_PAGES,
    PRODUCT_TAGS,
    SALE_PRICES,
    getProductTags,
    getSalePrice,
    getEffectivePrice,
    getCatalogProducts,
    getLineProducts,
    getCollectionBySlug,
    getCollectionProducts,
    getContentPage,
  });
})();
