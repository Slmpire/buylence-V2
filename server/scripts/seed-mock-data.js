/**
 * Buylence Demo / Test Seed Script
 * Populates vendors, products with 100% verified working images,
 * and realistic test orders for testing the Rider Portal and Marketplace.
 */

const prisma = require('../src/utils/prisma')

const IMAGES = {
  // Grains & Cereals
  ofadaRice: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  whiteGarri: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  spaghetti: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?auto=format&fit=crop&w=600&q=80',
  brownBeans: 'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=600&q=80',
  rolledOats: 'https://images.unsplash.com/photo-1584776296944-ab6fb57b0bdd?auto=format&fit=crop&w=600&q=80',
  cereal: 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?auto=format&fit=crop&w=600&q=80',

  // Tubers & Roots
  yamTubers: 'https://images.unsplash.com/photo-1590868309235-ea34bed7bd7f?auto=format&fit=crop&w=600&q=80',
  sweetPotatoes: 'https://images.unsplash.com/photo-1596560548464-f010549b84d7?auto=format&fit=crop&w=600&q=80',
  irishPotatoes: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=600&q=80',
  plantains: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=600&q=80',

  // Proteins & Meat
  freshFish: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=600&q=80',
  frozenChicken: 'https://images.unsplash.com/photo-1587593810167-a84920ea0781?auto=format&fit=crop&w=600&q=80',
  freshBeef: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=600&q=80',
  freshEggs: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',

  // Oils & Spices
  groundnutOil: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
  redPalmOil: 'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?auto=format&fit=crop&w=600&q=80',
  spices: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',

  // Vegetables & Fresh Produce
  freshTomatoes: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
  redOnions: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
  peppers: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?auto=format&fit=crop&w=600&q=80',
  greenLeaves: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',

  // Snacks & Bakery
  croissants: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80',
  freshBread: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
  chinChin: 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?auto=format&fit=crop&w=600&q=80',
  puffPuff: 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=600&q=80',
  meatPie: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=600&q=80',

  // Beverages & Drinks
  zoboDrink: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=600&q=80',
  softDrinks: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
  bottledWater: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=600&q=80',
  coldBrew: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=600&q=80',

  // Store Banners & Logos
  storeBanner1: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
  storeBanner2: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=80',
  storeBanner3: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80',
  storeLogo1: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80',
}

async function main() {
  console.log('🚀 Starting Buylence test data population...')

  // 1. Get or create a default buyer
  const buyer = await prisma.user.upsert({
    where: { email: 'pelumi@buylence.com' },
    update: {},
    create: {
      firebaseUid: 'seed-buyer-uid-pelumi',
      email: 'pelumi@buylence.com',
      fullName: 'Pelumi Adewale',
      phone: '08055443322',
      role: 'BUYER',
      hall: 'Awo Hall',
      room: 'Block 4, Room 18',
    },
  })
  console.log(`👤 Buyer ready: ${buyer.fullName} (${buyer.email})`)

  // 2. Find rider Siop
  let siopUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'sioplightman5@gmail.com' },
        { fullName: { contains: 'Siop', mode: 'insensitive' } },
      ],
      role: 'RIDER',
    },
    include: { rider: true },
  })

  if (!siopUser) {
    siopUser = await prisma.user.upsert({
      where: { email: 'sioplightman5@gmail.com' },
      update: { role: 'RIDER' },
      create: {
        firebaseUid: 'seed-rider-siop',
        email: 'sioplightman5@gmail.com',
        fullName: 'Siop Lightman',
        phone: '08100310284',
        role: 'RIDER',
      },
      include: { rider: true },
    })
  }

  let siopRider = siopUser.rider
  if (!siopRider) {
    siopRider = await prisma.rider.create({
      data: {
        userId: siopUser.id,
        vehicleType: 'CAR',
        isActive: true,
        totalDeliveries: 0,
      },
    })
  }
  console.log(`🛵 Rider ready: ${siopUser.fullName} (ID: ${siopRider.id})`)

  // 3. Define vendors and their products
  const VENDORS_DATA = [
    {
      email: 'mamaife@buylence.com',
      uid: 'seed-vendor-mamaife',
      owner: 'Ifeoma Adeyemi',
      storeName: "Mama Ife's Provisions",
      description: 'Your trusted campus store for staple grains, premium oils, and everyday cooking spices. Guaranteed full measure.',
      hall: 'Awo Hall',
      storeType: 'PHYSICAL_KIOSK',
      categories: ['Grains & Cereals', 'Oils & Spices'],
      delivers: ['Awo Hall', 'Moremi Hall', 'Fajuyi Hall', 'ETF Hall', 'Angola Hall'],
      deliveryFee: 250,
      rating: 4.9,
      totalReviews: 86,
      totalSales: 342,
      bannerUrl: IMAGES.storeBanner1,
      logoUrl: IMAGES.storeLogo1,
      products: [
        {
          name: 'Ofada Rice (1kg)',
          category: 'Grains & Cereals',
          unit: 'Per kg',
          price: 3200,
          comparePrice: 3800,
          stock: 65,
          images: [IMAGES.ofadaRice],
          flashDeal: true,
          description: 'Authentic local unpolished Ofada rice, cleanly sorted and stone-free.',
          units: [
            { label: '1kg Pack', price: 3200, comparePrice: 3800, stock: 40 },
            { label: '5kg Bag', price: 15500, comparePrice: 18000, stock: 25 },
          ],
        },
        {
          name: 'Ijebu White Garri (5kg)',
          category: 'Grains & Cereals',
          unit: 'Per pack',
          price: 4500,
          comparePrice: 5000,
          stock: 80,
          images: [IMAGES.whiteGarri],
          flashDeal: false,
          description: 'Crisp, sour Ijebu garri, fine grain. Great for drinking or eba.',
          units: [
            { label: 'Paint Rubber (approx 3.5kg)', price: 3200, stock: 50 },
            { label: '5kg Pack', price: 4500, comparePrice: 5000, stock: 30 },
          ],
        },
        {
          name: 'Golden Penny Spaghetti (500g)',
          category: 'Grains & Cereals',
          unit: 'Per pack',
          price: 900,
          comparePrice: 1000,
          stock: 120,
          images: [IMAGES.spaghetti],
          flashDeal: false,
          description: 'Long, fortified durum wheat semolina spaghetti pasta.',
          units: [
            { label: 'Single Pack (500g)', price: 900, stock: 70 },
            { label: 'Carton (20 packs)', price: 17500, comparePrice: 19000, stock: 10 },
          ],
        },
        {
          name: 'Brown Beans Oloyin (2kg)',
          category: 'Grains & Cereals',
          unit: 'Per pack',
          price: 3800,
          comparePrice: null,
          stock: 45,
          images: [IMAGES.brownBeans],
          flashDeal: false,
          description: 'Naturally sweet Honey beans (Oloyin), cooks fast and soft.',
        },
        {
          name: 'Groundnut Oil (1 Litre Bottle)',
          category: 'Oils & Spices',
          unit: 'Per bottle',
          price: 2600,
          comparePrice: 3000,
          stock: 50,
          images: [IMAGES.groundnutOil],
          flashDeal: false,
          description: 'Pure refined vegetable cooking oil, cholesterol-free.',
        },
        {
          name: 'Traditional Red Palm Oil (1L)',
          category: 'Oils & Spices',
          unit: 'Per bottle',
          price: 2400,
          comparePrice: null,
          stock: 35,
          images: [IMAGES.redPalmOil],
          flashDeal: false,
          description: 'Fresh farm-milled red palm oil with rich color and aroma.',
        },
      ],
    },
    {
      email: 'moremidelights@buylence.com',
      uid: 'seed-vendor-moremi',
      owner: 'Amaka Obi',
      storeName: 'Moremi Delights & Bakery',
      description: 'Fresh pastries, oven-baked snacks, chilled zobo and refreshing drinks delivered warm to your hostel door.',
      hall: 'Moremi Hall',
      storeType: 'PHYSICAL_KIOSK',
      categories: ['Snacks & Bakery', 'Beverages & Drinks'],
      delivers: ['Moremi Hall', 'Fajuyi Hall', 'Awo Hall', 'ETF Hall', 'Mozambique Hall'],
      deliveryFee: 200,
      rating: 4.8,
      totalReviews: 112,
      totalSales: 480,
      bannerUrl: IMAGES.storeBanner2,
      logoUrl: IMAGES.croissants,
      products: [
        {
          name: 'Flaky Golden Croissants (Pack of 2)',
          category: 'Snacks & Bakery',
          unit: 'Per pack',
          price: 1800,
          comparePrice: 2200,
          stock: 25,
          images: [IMAGES.croissants],
          flashDeal: true,
          description: 'Warm, flaky French-style butter croissants baked fresh every morning.',
        },
        {
          name: 'Warm Agege Bread (Family Loaf)',
          category: 'Snacks & Bakery',
          unit: 'Per loaf',
          price: 1200,
          comparePrice: null,
          stock: 60,
          images: [IMAGES.freshBread],
          flashDeal: false,
          description: 'Soft, stretchy, sweet Agege bread. Goes perfectly with fried eggs or beans.',
        },
        {
          name: 'Crispy Chin Chin (300g Jar)',
          category: 'Snacks & Bakery',
          unit: 'Per jar',
          price: 1200,
          comparePrice: 1500,
          stock: 75,
          images: [IMAGES.chinChin],
          flashDeal: false,
          description: 'Crunchy milky chin chin flavored with nutmeg and butter.',
        },
        {
          name: 'Hot Puff Puff (10 Pieces)',
          category: 'Snacks & Bakery',
          unit: 'Per pack',
          price: 700,
          comparePrice: null,
          stock: 50,
          images: [IMAGES.puffPuff],
          flashDeal: true,
          description: 'Golden fried dough balls, sweet and fluffy inside.',
        },
        {
          name: 'Beef Meat Pie',
          category: 'Snacks & Bakery',
          unit: 'Per piece',
          price: 900,
          comparePrice: 1100,
          stock: 40,
          images: [IMAGES.meatPie],
          flashDeal: false,
          description: 'Rich pastry crust filled with minced beef, potatoes, and savory spices.',
        },
        {
          name: 'Chilled Hibiscus Zobo (1 Litre)',
          category: 'Beverages & Drinks',
          unit: 'Per bottle',
          price: 1100,
          comparePrice: 1300,
          stock: 45,
          images: [IMAGES.zoboDrink],
          flashDeal: false,
          description: 'Refreshing spiced zobo drink with natural pineapple and ginger twist.',
        },
      ],
    },
    {
      email: 'tundemart@buylence.com',
      uid: 'seed-vendor-tunde',
      owner: 'Tunde Bakare',
      storeName: "Tunde's Fresh Proteins",
      description: 'Hygienically cleaned and stored fresh fish, frozen chicken, beef cuts, and farm eggs.',
      hall: 'Fajuyi Hall',
      storeType: 'PHYSICAL_KIOSK',
      categories: ['Proteins & Meat'],
      delivers: ['Fajuyi Hall', 'Awo Hall', 'Moremi Hall', 'ETF Hall'],
      deliveryFee: 300,
      rating: 4.7,
      totalReviews: 68,
      totalSales: 290,
      bannerUrl: IMAGES.storeBanner3,
      logoUrl: IMAGES.freshFish,
      products: [
        {
          name: 'Fresh Whole Tilapia Fish (1kg)',
          category: 'Proteins & Meat',
          unit: 'Per kg',
          price: 5200,
          comparePrice: 5800,
          stock: 20,
          images: [IMAGES.freshFish],
          flashDeal: false,
          description: 'Freshly dressed and descaled tilapia fish, ready to fry or stew.',
        },
        {
          name: 'Grade A Frozen Chicken (1kg cut)',
          category: 'Proteins & Meat',
          unit: 'Per kg',
          price: 6000,
          comparePrice: 6500,
          stock: 30,
          images: [IMAGES.frozenChicken],
          flashDeal: true,
          description: 'Tender, juicy cuts of frozen chicken laps and breasts.',
        },
        {
          name: 'Boneless Fresh Beef (1kg)',
          category: 'Proteins & Meat',
          unit: 'Per kg',
          price: 6500,
          comparePrice: null,
          stock: 25,
          images: [IMAGES.freshBeef],
          flashDeal: false,
          description: 'Fresh morning slaughter beef, trimmed of excess fat.',
        },
        {
          name: 'Fresh Farm Eggs (Crate of 30)',
          category: 'Proteins & Meat',
          unit: 'Per crate',
          price: 4800,
          comparePrice: 5200,
          stock: 40,
          images: [IMAGES.freshEggs],
          flashDeal: false,
          description: 'Clean jumbo brown eggs straight from the farm poultry.',
          units: [
            { label: 'Crate (30 eggs)', price: 4800, comparePrice: 5200, stock: 30 },
            { label: 'Half Crate (15 eggs)', price: 2500, stock: 20 },
          ],
        },
      ],
    },
    {
      email: 'campusgreens@buylence.com',
      uid: 'seed-vendor-greens',
      owner: 'Blessing Alabi',
      storeName: 'Ife Green Grocers',
      description: 'Daily fresh vegetables, red tomatoes, peppers, and fresh soup condiments.',
      hall: 'Mozambique Hall',
      storeType: 'PHYSICAL_KIOSK',
      categories: ['Vegetables & Fresh Produce', 'Tubers & Roots'],
      delivers: ['Mozambique Hall', 'Angola Hall', 'Moremi Hall', 'Awo Hall'],
      deliveryFee: 200,
      rating: 4.9,
      totalReviews: 54,
      totalSales: 175,
      bannerUrl: IMAGES.storeBanner1,
      logoUrl: IMAGES.freshTomatoes,
      products: [
        {
          name: 'Fresh Plum Tomatoes (Medium Basket)',
          category: 'Vegetables & Fresh Produce',
          unit: 'Per basket',
          price: 2500,
          comparePrice: 2800,
          stock: 35,
          images: [IMAGES.freshTomatoes],
          flashDeal: false,
          description: 'Firm, ripe plum tomatoes for delicious Nigerian stew.',
        },
        {
          name: 'Red Onions (10 Large Bulbs)',
          category: 'Vegetables & Fresh Produce',
          unit: 'Per bundle',
          price: 1800,
          comparePrice: null,
          stock: 45,
          images: [IMAGES.redOnions],
          flashDeal: false,
          description: 'Pungent red Nigerian onions, dry and long-lasting.',
        },
        {
          name: 'Scotch Bonnet / Ata Rodo (Pack)',
          category: 'Vegetables & Fresh Produce',
          unit: 'Per pack',
          price: 1200,
          comparePrice: null,
          stock: 40,
          images: [IMAGES.peppers],
          flashDeal: false,
          description: 'Spicy fresh red habanero peppers.',
        },
        {
          name: 'Fresh Fluted Pumpkin Leaves / Ugwu',
          category: 'Vegetables & Fresh Produce',
          unit: 'Per bundle',
          price: 800,
          comparePrice: null,
          stock: 50,
          images: [IMAGES.greenLeaves],
          flashDeal: false,
          description: 'Crisp green ugwu leaves, chopped or unchopped upon request.',
        },
        {
          name: 'Sweet Yam Tubers (Medium 3-piece)',
          category: 'Tubers & Roots',
          unit: 'Per bundle',
          price: 4800,
          comparePrice: 5500,
          stock: 30,
          images: [IMAGES.yamTubers],
          flashDeal: true,
          description: 'Fluffy white yam tubers, great for boiled yam, pounded yam, or chips.',
        },
        {
          name: 'Ripe Yellow Plantains (Bunch of 5)',
          category: 'Tubers & Roots',
          unit: 'Per bunch',
          price: 2200,
          comparePrice: 2500,
          stock: 40,
          images: [IMAGES.plantains],
          flashDeal: false,
          description: 'Sweet ripe plantains ready for frying dodo or roasting boli.',
        },
      ],
    },
    {
      email: 'subcafe@buylence.com',
      uid: 'seed-vendor-subcafe',
      owner: 'Femi Daniels',
      storeName: 'SUB Corner & Cold Drinks',
      description: 'Chilled energy drinks, cold brew, sodas, bottled water, and study snacks located right at the Student Union Building.',
      hall: 'ETF Hall',
      storeType: 'PHYSICAL_KIOSK',
      categories: ['Beverages & Drinks', 'Snacks & Bakery'],
      delivers: ['ETF Hall', 'Awo Hall', 'Fajuyi Hall', 'Moremi Hall', 'Angola Hall'],
      deliveryFee: 200,
      rating: 4.6,
      totalReviews: 95,
      totalSales: 410,
      bannerUrl: IMAGES.storeBanner2,
      logoUrl: IMAGES.softDrinks,
      products: [
        {
          name: 'Bottled Pure Water (75cl Pack of 12)',
          category: 'Beverages & Drinks',
          unit: 'Per pack',
          price: 1800,
          comparePrice: 2000,
          stock: 90,
          images: [IMAGES.bottledWater],
          flashDeal: false,
          description: 'Purified table drinking water pack for hostel study nights.',
        },
        {
          name: 'Assorted Chilled Soft Drinks (50cl Pet)',
          category: 'Beverages & Drinks',
          unit: 'Per bottle',
          price: 500,
          comparePrice: null,
          stock: 150,
          images: [IMAGES.softDrinks],
          flashDeal: false,
          description: 'Ice cold Coca-Cola, Fanta, Sprite, or Pepsi.',
        },
        {
          name: 'Iced Vanilla Cold Brew Coffee (450ml)',
          category: 'Beverages & Drinks',
          unit: 'Per cup',
          price: 1600,
          comparePrice: 1900,
          stock: 35,
          images: [IMAGES.coldBrew],
          flashDeal: true,
          description: 'Slow-steeped smooth iced coffee with a drop of sweet cream and vanilla.',
        },
      ],
    },
  ]

  const createdVendors = []

  // 4. Create / Upsert vendors and their products
  for (const vData of VENDORS_DATA) {
    const user = await prisma.user.upsert({
      where: { email: vData.email },
      update: { fullName: vData.owner, role: 'VENDOR' },
      create: {
        firebaseUid: vData.uid,
        email: vData.email,
        fullName: vData.owner,
        phone: '080' + Math.floor(10000000 + Math.random() * 90000000),
        role: 'VENDOR',
        hall: vData.hall,
      },
    })

    const vendor = await prisma.vendor.upsert({
      where: { userId: user.id },
      update: {
        storeName: vData.storeName,
        description: vData.description,
        hall: vData.hall,
        storeType: vData.storeType,
        categories: vData.categories,
        deliveryAreas: vData.delivers,
        deliveryFee: vData.deliveryFee,
        rating: vData.rating,
        totalReviews: vData.totalReviews,
        totalSales: vData.totalSales,
        verified: true,
        onboarded: true,
        bannerUrl: vData.bannerUrl,
        logoUrl: vData.logoUrl,
      },
      create: {
        userId: user.id,
        storeName: vData.storeName,
        description: vData.description,
        hall: vData.hall,
        storeType: vData.storeType,
        categories: vData.categories,
        deliveryAreas: vData.delivers,
        deliveryFee: vData.deliveryFee,
        rating: vData.rating,
        totalReviews: vData.totalReviews,
        totalSales: vData.totalSales,
        verified: true,
        onboarded: true,
        bannerUrl: vData.bannerUrl,
        logoUrl: vData.logoUrl,
      },
    })

    createdVendors.push(vendor)

    // Clear old products for this vendor and re-create fresh ones
    await prisma.product.deleteMany({ where: { vendorId: vendor.id } })

    for (const prod of vData.products) {
      const createdProd = await prisma.product.create({
        data: {
          vendorId: vendor.id,
          name: prod.name,
          category: prod.category,
          unit: prod.unit,
          price: prod.price,
          comparePrice: prod.comparePrice,
          stock: prod.stock,
          images: prod.images,
          description: prod.description,
          flashDeal: prod.flashDeal,
          availableHalls: vData.delivers,
          isActive: true,
          ...(prod.units && prod.units.length > 0 && {
            units: {
              create: prod.units.map(u => ({
                label: u.label,
                price: u.price,
                comparePrice: u.comparePrice || null,
                stock: u.stock || 20,
              })),
            },
          }),
        },
      })
    }

    console.log(`  ✓ Vendor "${vendor.storeName}" (${vendor.hall}) seeded with ${vData.products.length} products.`)
  }

  // 5. Also fix any other products in the DB that have empty `images: []`
  const emptyImgProds = await prisma.product.findMany({
    where: { OR: [{ images: { equals: [] } }] },
  })

  for (const p of emptyImgProds) {
    let img = IMAGES.ofadaRice
    const lower = (p.name + ' ' + p.category).toLowerCase()
    if (lower.includes('garri') || lower.includes('grain')) img = IMAGES.whiteGarri
    else if (lower.includes('rice')) img = IMAGES.ofadaRice
    else if (lower.includes('oil')) img = IMAGES.groundnutOil
    else if (lower.includes('fish') || lower.includes('meat') || lower.includes('chicken')) img = IMAGES.freshFish
    else if (lower.includes('yam') || lower.includes('potato') || lower.includes('tuber')) img = IMAGES.yamTubers
    else if (lower.includes('bread') || lower.includes('snack') || lower.includes('pie')) img = IMAGES.meatPie

    await prisma.product.update({
      where: { id: p.id },
      data: { images: [img] },
    })
  }
  if (emptyImgProds.length > 0) {
    console.log(`  ✓ Updated ${emptyImgProds.length} previously imageless products with valid photos.`)
  }

  // 6. Seed sample orders for Rider testing (Pool, Active, and History)
  console.log('\n📦 Seeding rider orders for testing...')

  const sampleProducts = await prisma.product.findMany({ take: 10 })

  // Clean up previous test seed orders to prevent clutter
  await prisma.order.deleteMany({
    where: { orderNumber: { startsWith: 'TEST-' } },
  })

  // A. POOL ORDERS (Status: READY_FOR_PICKUP) - Ready for Siop to claim!
  const poolOrdersData = [
    {
      num: 'TEST-01-AWO',
      vendor: createdVendors[0], // Mama Ife
      hall: 'Awo Hall',
      room: 'Block 2, Room 14',
      fee: 250,
      subtotal: 4100,
      items: [
        { name: 'Ofada Rice (1kg)', price: 3200, qty: 1 },
        { name: 'Golden Penny Spaghetti', price: 900, qty: 1 },
      ],
    },
    {
      num: 'TEST-02-MOREMI',
      vendor: createdVendors[1], // Moremi Delights
      hall: 'Moremi Hall',
      room: 'Wing B, Room 22',
      fee: 200,
      subtotal: 2500,
      items: [
        { name: 'Flaky Golden Croissants (Pack of 2)', price: 1800, qty: 1 },
        { name: 'Hot Puff Puff (10 Pieces)', price: 700, qty: 1 },
      ],
    },
    {
      num: 'TEST-03-FAJUYI',
      vendor: createdVendors[2], // Tunde's Proteins
      hall: 'Fajuyi Hall',
      room: 'Block 1, Room 08',
      fee: 300,
      subtotal: 6000,
      items: [
        { name: 'Grade A Frozen Chicken (1kg cut)', price: 6000, qty: 1 },
      ],
    },
  ]

  for (const po of poolOrdersData) {
    await prisma.order.create({
      data: {
        orderNumber: po.num,
        buyerId: buyer.id,
        vendorId: po.vendor.id,
        status: 'READY_FOR_PICKUP',
        readyForPickupAt: new Date(Date.now() - 5 * 60 * 1000),
        deliveryHall: po.hall,
        deliveryRoom: po.room,
        recipientName: buyer.fullName,
        recipientPhone: buyer.phone || '08055443322',
        subtotal: po.subtotal,
        deliveryFee: po.fee,
        total: po.subtotal + po.fee,
        paymentMethod: 'PAYSTACK',
        paymentStatus: 'HELD_IN_ESCROW',
        items: {
          create: po.items.map((it, idx) => ({
            productId: sampleProducts[idx % sampleProducts.length].id,
            name: it.name,
            price: it.price,
            quantity: it.qty,
          })),
        },
      },
    })
  }
  console.log(`  ✓ Created ${poolOrdersData.length} orders in Rider Pool (READY_FOR_PICKUP).`)

  // B. ACTIVE DELIVERIES (Status: ASSIGNED_TO_RIDER and PICKED_UP) assigned to Siop
  const activeOrdersData = [
    {
      num: 'TEST-04-CLAIMED',
      vendor: createdVendors[1], // Moremi Delights
      hall: 'ETF Hall',
      room: 'Block 3, Room 10',
      fee: 200,
      subtotal: 2300,
      status: 'ASSIGNED_TO_RIDER', // Rider claimed, needs pickup code
      claimedAt: new Date(Date.now() - 10 * 60 * 1000),
      items: [
        { name: 'Warm Agege Bread (Family Loaf)', price: 1200, qty: 1 },
        { name: 'Chilled Hibiscus Zobo (1 Litre)', price: 1100, qty: 1 },
      ],
    },
    {
      num: 'TEST-05-PICKEDUP',
      vendor: createdVendors[0], // Mama Ife
      hall: 'Fajuyi Hall',
      room: 'Block 4, Room 2',
      fee: 250,
      subtotal: 4500,
      status: 'PICKED_UP', // Items picked up, rider on way to buyer, needs delivery code
      claimedAt: new Date(Date.now() - 25 * 60 * 1000),
      pickedUpAt: new Date(Date.now() - 12 * 60 * 1000),
      items: [
        { name: 'Ijebu White Garri (5kg)', price: 4500, qty: 1 },
      ],
    },
  ]

  for (const ao of activeOrdersData) {
    await prisma.order.create({
      data: {
        orderNumber: ao.num,
        buyerId: buyer.id,
        vendorId: ao.vendor.id,
        riderId: siopRider.id,
        status: ao.status,
        claimedAt: ao.claimedAt,
        pickedUpAt: ao.pickedUpAt || null,
        deliveryHall: ao.hall,
        deliveryRoom: ao.room,
        recipientName: 'Tobi Fashola',
        recipientPhone: '08123456789',
        subtotal: ao.subtotal,
        deliveryFee: ao.fee,
        total: ao.subtotal + ao.fee,
        paymentMethod: 'PAYSTACK',
        paymentStatus: 'HELD_IN_ESCROW',
        items: {
          create: ao.items.map((it, idx) => ({
            productId: sampleProducts[(idx + 2) % sampleProducts.length].id,
            name: it.name,
            price: it.price,
            quantity: it.qty,
          })),
        },
      },
    })
  }
  console.log(`  ✓ Created ${activeOrdersData.length} active orders assigned to ${siopUser.fullName}.`)

  // C. COMPLETED DELIVERIES for History & Earnings (Status: CONFIRMED_BY_BUYER)
  const completedOrdersData = [
    {
      num: 'TEST-06-HIST1',
      vendor: createdVendors[0],
      hall: 'Moremi Hall',
      fee: 300,
      subtotal: 5800,
      hoursAgo: 2,
      durationMinutes: 14,
    },
    {
      num: 'TEST-07-HIST2',
      vendor: createdVendors[1],
      hall: 'Awo Hall',
      fee: 250,
      subtotal: 3100,
      hoursAgo: 4,
      durationMinutes: 18,
    },
    {
      num: 'TEST-08-HIST3',
      vendor: createdVendors[2],
      hall: 'Fajuyi Hall',
      fee: 300,
      subtotal: 6500,
      hoursAgo: 26, // yesterday
      durationMinutes: 12,
    },
    {
      num: 'TEST-09-HIST4',
      vendor: createdVendors[3],
      hall: 'Angola Hall',
      fee: 200,
      subtotal: 4800,
      hoursAgo: 48, // 2 days ago
      durationMinutes: 15,
    },
  ]

  for (const co of completedOrdersData) {
    const deliveredAt = new Date(Date.now() - co.hoursAgo * 3600 * 1000)
    const pickedUpAt = new Date(deliveredAt.getTime() - co.durationMinutes * 60 * 1000)
    const claimedAt = new Date(pickedUpAt.getTime() - 10 * 60 * 1000)

    await prisma.order.create({
      data: {
        orderNumber: co.num,
        buyerId: buyer.id,
        vendorId: co.vendor.id,
        riderId: siopRider.id,
        status: 'CONFIRMED_BY_BUYER',
        claimedAt,
        pickedUpAt,
        riderConfirmedAt: deliveredAt,
        buyerConfirmedAt: deliveredAt,
        escrowReleasedAt: deliveredAt,
        deliveryHall: co.hall,
        deliveryRoom: 'Room 15',
        recipientName: buyer.fullName,
        recipientPhone: buyer.phone || '08055443322',
        subtotal: co.subtotal,
        deliveryFee: co.fee,
        total: co.subtotal + co.fee,
        paymentMethod: 'PAYSTACK',
        paymentStatus: 'RELEASED',
        items: {
          create: [
            {
              productId: sampleProducts[0].id,
              name: 'Campus Grocery Delivery',
              price: co.subtotal,
              quantity: 1,
            },
          ],
        },
      },
    })
  }

  // Update Siop's total deliveries count
  const completedCount = await prisma.order.count({
    where: {
      riderId: siopRider.id,
      status: { in: ['CONFIRMED_BY_BUYER', 'DELIVERED_BY_RIDER'] },
    },
  })

  await prisma.rider.update({
    where: { id: siopRider.id },
    data: { totalDeliveries: completedCount },
  })

  console.log(`  ✓ Created ${completedOrdersData.length} completed deliveries for rider history & earnings.`)
  console.log(`  ✓ Updated Siop's total completed deliveries count to: ${completedCount}`)
  console.log('\n🎉 Database population complete! Marketplace & Rider Portal are fully test-ready.')
}

main()
  .catch(err => {
    console.error('❌ Population error:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
