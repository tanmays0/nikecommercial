/**
 * Nike Commercial — Centralized Product Database
 * Global inventory for multi-page e-commerce routes.
 */
(function () {
  'use strict';

  const IMG = (id, w = 900) =>
    `https://images.unsplash.com/photo-${id}?w=${w}&q=85&fit=crop&auto=format`;

  const LOCAL = (id) => `assets/products/${id}.jpg`;

  /** @type {Array<{id:string,name:string,category:string,subcategory:string,price:number,description:string,images:string[],sizes:(number|string)[],colors:string[]}>} */
  const PRODUCTS = [
    /* ── Men · Shoes ── */
    {
      id: 'nike-air-max-pulse-01',
      name: 'Nike Air Max Pulse',
      category: 'men',
      subcategory: 'shoes',
      price: 150,
      description:
        'Inspired by the energy of London, the Air Max Pulse delivers an edgy aesthetic with textured overlays, visible Air cushioning, and street-ready comfort built for cities that never sleep.',
      images: [
        LOCAL('nike-air-max-pulse-01'),
        IMG('1515955656352-a1fa3ffcd111', 1200),
        IMG('1605348531061-53c21df2ed40', 1200),
      ],
      sizes: [7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12],
      colors: ['Photon Dust', 'Black', 'Anthracite'],
    },
    {
      id: 'nike-air-max-90-02',
      name: 'Nike Air Max 90',
      category: 'men',
      subcategory: 'shoes',
      price: 130,
      description:
        'Nothing as iconic. Nothing as versatile. The Air Max 90 stays true to its OG running roots with the same waffle outsole and stitched overlays that made it a legend.',
      images: [
        LOCAL('nike-air-max-90-02'),
        IMG('1542291026-7eec264c27ff', 1200),
        IMG('1460353581641-37baddab0fa2', 1200),
      ],
      sizes: [7, 8, 8.5, 9, 9.5, 10, 11, 12],
      colors: ['Infrared', 'White', 'Triple Black'],
    },
    {
      id: 'nike-air-max-plus-03',
      name: 'Nike Air Max Plus',
      category: 'men',
      subcategory: 'shoes',
      price: 180,
      description:
        'The unmistakable Tuned Air silhouette returns with gradient overlays and aggressive lines. Maximum attitude, maximum cushioning, zero compromise.',
      images: [
        LOCAL('nike-air-max-plus-03'),
        IMG('1600185365926-3a2ce3cdb9eb', 1200),
        IMG('1608231387042-66d1773070a5', 1200),
      ],
      sizes: [7, 8, 9, 10, 11, 12, 13],
      colors: ['Hyper Blue', 'Black Volt', 'Sunset'],
    },
    {
      id: 'nike-pegasus-premium-04',
      name: 'Nike Pegasus Premium',
      category: 'men',
      subcategory: 'shoes',
      price: 210,
      description:
        'Responsive ZoomX foam meets a breathable engineered mesh upper. Built for daily miles with a spring-loaded ride that disappears underfoot.',
      images: [
        LOCAL('nike-pegasus-premium-04'),
        IMG('1549298916-b41d501d3772', 1200),
        IMG('1606107557195-0a74d7a3c9a7', 1200),
      ],
      sizes: [7, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12],
      colors: ['Sail', 'Obsidian', 'Bright Crimson'],
    },

    /* ── Men · Apparel ── */
    {
      id: 'nike-dri-fit-advance-05',
      name: 'Nike Dri-FIT ADV Running Top',
      category: 'men',
      subcategory: 'apparel',
      price: 65,
      description:
        'Ultralight, sweat-wicking fabric with bonded seams and reflective hits. Engineered for tempo days when every second counts.',
      images: [
        LOCAL('nike-dri-fit-advance-05'),
        IMG('1618354691373-d851c5c3d990', 1200),
        IMG('1517836357463-d25dfeac3438', 1200),
      ],
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: ['Black', 'Olive Aura', 'Photon Dust'],
    },
    {
      id: 'nike-tech-fleece-jogger-06',
      name: 'Nike Tech Fleece Joggers',
      category: 'men',
      subcategory: 'apparel',
      price: 120,
      description:
        'Premium lightweight fleece with articulated seams and tapered legs. Warmth without bulk — the uniform of off-duty athletes everywhere.',
      images: [
        LOCAL('nike-tech-fleece-jogger-06'),
        IMG('1483986768364-40f7e8d4b384', 1200),
        IMG('1556821840-3a63f95609a7', 1200),
      ],
      sizes: ['S', 'M', 'L', 'XL'],
      colors: ['Dark Grey Heather', 'Black', 'Navy'],
    },

    /* ── Women · Shoes ── */
    {
      id: 'nike-air-max-1-07',
      name: 'Nike Air Max 1',
      category: 'women',
      subcategory: 'shoes',
      price: 140,
      description:
        'The shoe that started it all. A timeless blend of heritage design and visible Air that continues to define sneaker culture decade after decade.',
      images: [
        LOCAL('nike-air-max-1-07'),
        IMG('1595950653106-6c9ebd614d3a', 1200),
        IMG('1571019613454-1cb2f99b2d8b', 1200),
      ],
      sizes: [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 10],
      colors: ['University Red', 'White', 'Panda'],
    },
    {
      id: 'nike-air-max-97-08',
      name: 'Nike Air Max 97',
      category: 'women',
      subcategory: 'shoes',
      price: 175,
      description:
        'Inspired by Japanese bullet trains, the full-length Max Air unit and fluid design lines create a futuristic profile that still turns heads.',
      images: [
        LOCAL('nike-air-max-97-08'),
        IMG('1506629082955-511b1aa562c8', 1200),
        IMG('1434389677669-e08b4cac3105', 1200),
      ],
      sizes: [5, 6, 6.5, 7, 7.5, 8, 9, 10],
      colors: ['Silver Bullet', 'Gold', 'Black'],
    },
    {
      id: 'nike-dunk-low-09',
      name: 'Nike Dunk Low',
      category: 'women',
      subcategory: 'shoes',
      price: 115,
      description:
        'Born on the hardwood, adopted by the streets. Crisp leather panels and a padded collar deliver classic hoops style with all-day wearability.',
      images: [
        LOCAL('nike-dunk-low-09'),
        IMG('1544367567-0f2fcb009e0b', 1200),
        IMG('1517466787929-bc90951d0974', 1200),
      ],
      sizes: [5, 5.5, 6, 6.5, 7, 7.5, 8, 9, 10],
      colors: ['Panda', 'Rose Whisper', 'Vintage Green'],
    },
    {
      id: 'nike-vomero-17-10',
      name: 'Nike Vomero 17',
      category: 'women',
      subcategory: 'shoes',
      price: 160,
      description:
        'Plush ZoomX cushioning stacked atop responsive foam for a luxurious ride. Your go-to when comfort is non-negotiable and style still matters.',
      images: [
        LOCAL('nike-vomero-17-10'),
        IMG('1603487742131-0d8e2c62ad2b', 1200),
        IMG('1552374196-1c95def2fa91', 1200),
      ],
      sizes: [5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 10],
      colors: ['Barely Volt', 'Platinum Tint', 'Black'],
    },

    /* ── Women · Apparel ── */
    {
      id: 'nike-yoga-luxe-legging-11',
      name: 'Nike Yoga Luxe Leggings',
      category: 'women',
      subcategory: 'apparel',
      price: 98,
      description:
        'Buttery-soft Infinalon fabric with a high-rise waist and minimal seams. Second-skin support for flow sessions and everything after.',
      images: [
        LOCAL('nike-yoga-luxe-legging-11'),
        IMG('1515886657613-9f3515b0c78f', 1200),
        IMG('1487412720507-e7ab37603c6f', 1200),
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Black', 'Desert Berry', 'Smokey Mauve'],
    },
    {
      id: 'nike-windrunner-jacket-12',
      name: 'Nike Windrunner Jacket',
      category: 'women',
      subcategory: 'apparel',
      price: 110,
      description:
        'An icon since 1978. Lightweight woven fabric, chevron yoke, and a relaxed fit that layers effortlessly over any training kit.',
      images: [
        LOCAL('nike-windrunner-jacket-12'),
        IMG('1490481651871-ab68de25d43d', 1200),
        IMG('1539100149721-cc2cb4c1a1c4', 1200),
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Summit White', 'Midnight Navy', 'Cedar'],
    },

    /* ── Kids · Shoes ── */
    {
      id: 'nike-air-max-dn-13',
      name: 'Nike Air Max DN',
      category: 'kids',
      subcategory: 'shoes',
      price: 120,
      description:
        'Dynamic Air unit delivers a bold bounce kids love. Futuristic lines and bold color blocking make every step feel like launch day.',
      images: [
        LOCAL('nike-air-max-dn-13'),
        IMG('1556909114-f6a7abf7aacd', 1200),
        IMG('1560472354-b33ff0c44a43', 1200),
      ],
      sizes: [10.5, 11, 11.5, 12, 12.5, 13, 1, 1.5, 2, 2.5, 3],
      colors: ['Hyper Pink', 'Electric Algae', 'Black'],
    },
    {
      id: 'nike-star-runner-14',
      name: 'Nike Star Runner 4',
      category: 'kids',
      subcategory: 'shoes',
      price: 65,
      description:
        'Soft foam cushioning and a flexible outsole keep young feet comfortable from playground to PE class. Easy slip-on option for busy mornings.',
      images: [
        LOCAL('nike-star-runner-14'),
        IMG('1576678927484-cc907957088a', 1200),
        IMG('1584735171499-0603b0de4980', 1200),
      ],
      sizes: [10.5, 11, 12, 13, 1, 2, 3, 4, 5, 6],
      colors: ['Royal Pulse', 'Volt', 'White'],
    },
    {
      id: 'nike-flex-runner-15',
      name: 'Nike Flex Runner 3',
      category: 'kids',
      subcategory: 'shoes',
      price: 55,
      description:
        'A sock-like bootie and flexible grooves let growing feet move naturally. Lightweight, breathable, and ready for nonstop adventure.',
      images: [
        LOCAL('nike-flex-runner-15'),
        IMG('1582582495641-f262209164b7', 1200),
        IMG('1551488846-b892a8a4f720', 1200),
      ],
      sizes: [10.5, 11, 12, 13, 1, 2, 3, 4, 5],
      colors: ['Black White', 'Crimson', 'Blue Hero'],
    },

    /* ── Kids · Apparel ── */
    {
      id: 'nike-kids-dri-fit-tee-16',
      name: 'Nike Kids Dri-FIT Tee',
      category: 'kids',
      subcategory: 'apparel',
      price: 28,
      description:
        'Sweat-wicking fabric keeps kids cool during recess, practice, and everything in between. Soft feel with bold Swoosh branding they will love.',
      images: [
        LOCAL('nike-kids-dri-fit-tee-16'),
        IMG('1503454537195-1dcabb73ffb9', 1200),
        IMG('1562157093-c37a09ab29c5', 1200),
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Game Royal', 'White', 'Black'],
    },
    {
      id: 'nike-kids-fleece-hoodie-17',
      name: 'Nike Kids Club Fleece Hoodie',
      category: 'kids',
      subcategory: 'apparel',
      price: 45,
      description:
        'Brushed-back fleece delivers cozy warmth with a kangaroo pocket for treasures. Ribbed cuffs and hem hold shape wash after wash.',
      images: [
        LOCAL('nike-kids-fleece-hoodie-17'),
        IMG('1503919003920-8a1e16f84f39', 1200),
        IMG('1571019613576-2b22c76fce9e', 1200),
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Grey Heather', 'Navy', 'University Red'],
    },
    {
      id: 'nike-kids-basketball-short-18',
      name: 'Nike Kids Basketball Shorts',
      category: 'kids',
      subcategory: 'apparel',
      price: 32,
      description:
        'Lightweight mesh with an elastic waistband built for crossover moves and post-game snacks. Dri-FIT technology manages moisture on court.',
      images: [
        LOCAL('nike-kids-basketball-short-18'),
        IMG('1473968512647-3e44729aa40d', 1200),
        IMG('1497032628192-86f1415ec54e', 1200),
      ],
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: ['Black', 'Team Orange', 'Midnight Navy'],
    },

    /* ── Accessories · Gear ── */
    {
      id: 'nike-heritage-backpack-19',
      name: 'Nike Heritage Backpack',
      category: 'accessories',
      subcategory: 'gear',
      price: 48,
      description:
        'Classic campus styling with a spacious main compartment and padded laptop sleeve. Durable canvas construction built for daily carry.',
      images: [
        LOCAL('nike-heritage-backpack-19'),
        IMG('1553062407-98eeb64c6a62', 1200),
        IMG('1502823403499-6ccfcf4fb453', 1200),
      ],
      sizes: ['One Size'],
      colors: ['Black', 'Ironstone', 'University Blue'],
    },
    {
      id: 'nike-brasilia-duffel-20',
      name: 'Nike Brasilia Duffel Bag',
      category: 'accessories',
      subcategory: 'gear',
      price: 55,
      description:
        'Roomy ventilated main compartment with separate shoe zone. Padded shoulder strap and haul handles for gym, travel, and tournament weekends.',
      images: [
        LOCAL('nike-brasilia-duffel-20'),
        IMG('1590874106882-6ec14896ff3b', 1200),
        IMG('1542290927-bc26432fc55d', 1200),
      ],
      sizes: ['Medium', 'Large'],
      colors: ['Black', 'Midnight Navy', 'Crimson'],
    },
    {
      id: 'nike-swoosh-cap-21',
      name: 'Nike Swoosh Cap',
      category: 'accessories',
      subcategory: 'gear',
      price: 28,
      description:
        'Structured crown with an embroidered Swoosh and adjustable closure. Clean lines and premium cotton twill for everyday coverage.',
      images: [
        LOCAL('nike-swoosh-cap-21'),
        IMG('1521369909029-2afed882baee', 1200),
        IMG('1463100648142-fb48795daf36', 1200),
      ],
      sizes: ['One Size'],
      colors: ['Black', 'White', 'Olive'],
    },
    {
      id: 'nike-gym-club-tote-22',
      name: 'Nike Gym Club Tote',
      category: 'accessories',
      subcategory: 'gear',
      price: 38,
      description:
        'Open-top tote with interior zip pocket and durable handles. From studio to street — minimal form, maximum function.',
      images: [
        LOCAL('nike-gym-club-tote-22'),
        IMG('1622560480605-d63c689e8a59', 1200),
        IMG('1512496015857-a90e38a29b2a', 1200),
      ],
      sizes: ['One Size'],
      colors: ['Black', 'Sail', 'Rose'],
    },
    {
      id: 'nike-running-belt-23',
      name: 'Nike Running Belt',
      category: 'accessories',
      subcategory: 'gear',
      price: 32,
      description:
        'Low-profile stretch belt with a secure zip pocket for keys and cards. Stays put through intervals without bounce or bulk.',
      images: [
        LOCAL('nike-running-belt-23'),
        IMG('1571902943202-507ec2618e8f', 1200),
        IMG('1539182207156-f625c9454e9e', 1200),
      ],
      sizes: ['S/M', 'L/XL'],
      colors: ['Black', 'Reflective Silver'],
    },
    {
      id: 'nike-pro-beanie-24',
      name: 'Nike Pro Hyperwarm Beanie',
      category: 'accessories',
      subcategory: 'gear',
      price: 24,
      description:
        'Therma-FIT fleece traps heat without adding weight. Soft stretch knit with a fold-over cuff for cold-weather miles and recovery days.',
      images: [
        LOCAL('nike-pro-beanie-24'),
        IMG('1514098164064-722216072aea', 1200),
        IMG('1445205170230-053b7fc7fde4', 1200),
      ],
      sizes: ['One Size'],
      colors: ['Black', 'Grey', 'Team Red'],
    },
  ];

  const CATEGORIES = ['men', 'women', 'kids', 'accessories'];

  const SUBCATEGORIES = ['shoes', 'apparel', 'gear'];

  function getProductById(id) {
    return PRODUCTS.find((p) => p.id === id) || null;
  }

  function getProductsByCategory(category) {
    return PRODUCTS.filter((p) => p.category === category);
  }

  function getProductsBySubcategory(subcategory) {
    return PRODUCTS.filter((p) => p.subcategory === subcategory);
  }

  function searchProducts(query) {
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [...PRODUCTS];

    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.includes(q) ||
        p.subcategory.includes(q) ||
        p.colors.some((c) => c.toLowerCase().includes(q))
    );
  }

  window.ProductsData = Object.freeze({
    PRODUCTS,
    CATEGORIES,
    SUBCATEGORIES,
    getProductById,
    getProductsByCategory,
    getProductsBySubcategory,
    searchProducts,
  });
})();
