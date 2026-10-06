// Seeds 6 sellers (User + Vendor) with products. Safe to re-run:
// it updates the sellers and replaces THEIR products only.
const prisma = require('../src/utils/prisma')

const HALLS = ['Awo Hall', 'Moremi Hall', 'Fajuyi Hall', 'Mozambique Hall', 'Angola Hall', 'ETF Hall']

// Category names match what your category pages query for (see CategoryPage usage).
const img = (name) => `https://placehold.co/600x600/F0D9C0/1A1A1A?text=${encodeURIComponent(name)}`

// p(name, category, price, unit, stock, description, extras)
const p = (name, category, price, unit, stock, description, extras = {}) =>
  ({ name, category, price, unit, stock, description, ...extras })

const SELLERS = [
  {
    slug: 'mama-ife',
    owner: 'Ifeoma Adeyemi',
    storeName: "Mama Ife's Provisions",
    description: 'Your one-stop kiosk for staple grains, oils and spices. Fair prices, honest measure.',
    hall: 'Awo Hall',
    storeType: 'PHYSICAL_KIOSK',
    categories: ['Grains & Cereals', 'Oils & Spices'],
    delivers: ['Awo Hall', 'Moremi Hall', 'Fajuyi Hall'],
    rating: 4.8, totalReviews: 64, totalSales: 210, deliveryFee: 300,
    products: [
      p('Ofada Rice', 'Grains & Cereals', 2800, 'Per kg', 60, 'Unpolished local ofada rice, stone-free and well sorted.'),
      p('White Garri (Ijebu)', 'Grains & Cereals', 1200, 'Per kg', 120, 'Crisp, sour Ijebu garri. Perfect for eba or soaking.', { flashDeal: true, comparePrice: 1500 }),
      p('Spaghetti (500g)', 'Grains & Cereals', 1100, 'Per pack', 80, 'Long spaghetti, cooks in 10 minutes.'),
      p('Rolled Oats', 'Grains & Cereals', 2200, 'Per pack', 40, 'Quick-cook oats for easy breakfasts.'),
      p('Vegetable Oil (1L)', 'Oils & Spices', 2900, 'Per litre', 50, 'Refined vegetable oil for everyday cooking.'),
      p('Palm Oil (1L)', 'Oils & Spices', 3200, 'Per litre', 35, 'Rich red palm oil, unadulterated.'),
      p('Curry & Thyme Mix', 'Oils & Spices', 350, 'Per pack', 150, 'Seasoning sachet for stews and jollof.'),
    ],
  },
  {
    slug: 'fresh-farm-hub',
    owner: 'Tunde Bakare',
    storeName: 'Fresh Farm Hub',
    description: 'Farm-fresh vegetables and tubers delivered to the halls every morning.',
    hall: 'Moremi Hall',
    storeType: 'MOBILE_VENDOR',
    categories: ['Vegetables', 'Tubers & Roots'],
    delivers: ['Moremi Hall', 'Awo Hall', 'Angola Hall', 'ETF Hall'],
    rating: 4.6, totalReviews: 38, totalSales: 145, deliveryFee: 250,
    products: [
      p('Fresh Tomatoes (Basket)', 'Vegetables', 3500, 'Per bundle', 25, 'Ripe, firm tomatoes. Good for stew all week.', { flashDeal: true, comparePrice: 4200 }),
      p('Tatashe (Red Bell Pepper)', 'Vegetables', 1500, 'Per bundle', 40, 'Sweet red peppers for stew base.'),
      p('Ata Rodo (Scotch Bonnet)', 'Vegetables', 1000, 'Per bundle', 45, 'Hot scotch bonnet peppers.'),
      p('Ugwu (Pumpkin Leaves)', 'Vegetables', 500, 'Per bundle', 60, 'Freshly cut ugwu, washed and tied.'),
      p('Onions (Red)', 'Vegetables', 1800, 'Per kg', 55, 'Dry red onions, long shelf life.'),
      p('Yam Tubers (Medium)', 'Tubers & Roots', 3000, 'Per piece', 30, 'Medium-sized white yam, good for boiling or frying.'),
      p('Sweet Potatoes', 'Tubers & Roots', 1400, 'Per kg', 50, 'Orange-flesh sweet potatoes.'),
      p('Irish Potatoes', 'Tubers & Roots', 1700, 'Per kg', 45, 'Washed Irish potatoes for chips and porridge.'),
    ],
  },
  {
    slug: 'protein-plug',
    owner: 'Chinedu Okafor',
    storeName: 'Protein Plug',
    description: 'Fresh and frozen proteins, cleaned and packed. Chicken, fish and eggs.',
    hall: 'Fajuyi Hall',
    storeType: 'HOSTEL_ROOM',
    categories: ['Proteins & Meat'],
    delivers: ['Fajuyi Hall', 'Mozambique Hall', 'Awo Hall'],
    rating: 4.7, totalReviews: 52, totalSales: 188, deliveryFee: 300,
    products: [
      p('Whole Chicken (Frozen)', 'Proteins & Meat', 6500, 'Per piece', 20, 'Cleaned whole frozen chicken, about 1.5kg.'),
      p('Chicken Laps (Frozen)', 'Proteins & Meat', 3800, 'Per kg', 35, 'Meaty chicken laps, ready to season.'),
      p('Titus Fish (Mackerel)', 'Proteins & Meat', 4500, 'Per kg', 25, 'Frozen titus fish, cleaned.'),
      p('Catfish (Fresh)', 'Proteins & Meat', 5200, 'Per kg', 15, 'Fresh catfish, cut and cleaned on request.'),
      p('Eggs (Crate of 30)', 'Proteins & Meat', 4800, 'Per crate', 30, 'Large fresh eggs.', { flashDeal: true, comparePrice: 5500 }),
      p('Beef (Boneless)', 'Proteins & Meat', 6800, 'Per kg', 18, 'Boneless beef cuts for stew and suya.'),
    ],
  },
  {
    slug: 'chops-and-sips',
    owner: 'Aisha Bello',
    storeName: 'Chops & Sips',
    description: 'Fresh snacks and cold drinks for study nights. Baked daily.',
    hall: 'Mozambique Hall',
    storeType: 'PHYSICAL_KIOSK',
    categories: ['Snacks & Beverages'],
    delivers: ['Mozambique Hall', 'Fajuyi Hall', 'Angola Hall', 'ETF Hall'],
    rating: 4.9, totalReviews: 91, totalSales: 340, deliveryFee: 200,
    products: [
      p('Chin Chin (Big Pack)', 'Snacks & Beverages', 1500, 'Per pack', 70, 'Crunchy homemade chin chin.'),
      p('Puff Puff (10 pcs)', 'Snacks & Beverages', 1000, 'Per pack', 50, 'Soft, freshly fried puff puff.'),
      p('Meat Pie', 'Snacks & Beverages', 800, 'Per piece', 60, 'Flaky pastry with minced beef filling.', { flashDeal: true, comparePrice: 1000 }),
      p('Zobo Drink (50cl)', 'Snacks & Beverages', 600, 'Per piece', 80, 'Chilled hibiscus zobo with ginger.'),
      p('Kunu (50cl)', 'Snacks & Beverages', 500, 'Per piece', 60, 'Cold millet kunu drink.'),
      p('Plantain Chips', 'Snacks & Beverages', 700, 'Per pack', 90, 'Salted ripe plantain chips.'),
      p('Doughnuts (Pack of 6)', 'Snacks & Beverages', 1800, 'Per pack', 40, 'Soft sugar-coated doughnuts.'),
    ],
  },
  {
    slug: 'angola-minimart',
    owner: 'Emeka Nwosu',
    storeName: 'Angola Mini-Mart',
    description: 'Everyday groceries and snacks in one place, right inside Angola Hall.',
    hall: 'Angola Hall',
    storeType: 'PHYSICAL_KIOSK',
    categories: ['Grains & Cereals', 'Oils & Spices', 'Snacks & Beverages'],
    delivers: ['Angola Hall', 'Moremi Hall', 'Mozambique Hall'],
    rating: 4.4, totalReviews: 27, totalSales: 96, deliveryFee: 250,
    products: [
      p('Local Rice (Stone-Free)', 'Grains & Cereals', 2500, 'Per kg', 75, 'Clean local rice, cooks fluffy.'),
      p('Brown Beans (Oloyin)', 'Grains & Cereals', 2600, 'Per kg', 50, 'Sweet oloyin beans, picked and cleaned.'),
      p('Indomie Noodles (Carton)', 'Grains & Cereals', 9500, 'Per crate', 22, 'Carton of 40 instant noodle packs.', { flashDeal: true, comparePrice: 10500 }),
      p('Groundnut Oil (1L)', 'Oils & Spices', 3400, 'Per litre', 30, 'Pure groundnut oil.'),
      p('Maggi Cubes (Pack)', 'Oils & Spices', 900, 'Per pack', 100, 'Seasoning cubes, pack of 50.'),
      p('Cabin Biscuit', 'Snacks & Beverages', 300, 'Per piece', 120, 'Classic cabin biscuit.'),
      p('Bottled Water (75cl, Pack of 12)', 'Snacks & Beverages', 2400, 'Per pack', 40, 'Pack of twelve 75cl bottled water.'),
    ],
  },
  {
    slug: 'etf-essentials',
    owner: 'Funmilayo Ojo',
    storeName: 'ETF Essentials',
    description: 'Breakfast and midnight-snack essentials for ETF Hall and nearby.',
    hall: 'ETF Hall',
    storeType: 'HOSTEL_ROOM',
    categories: ['Grains & Cereals', 'Snacks & Beverages'],
    delivers: ['ETF Hall', 'Angola Hall', 'Moremi Hall'],
    rating: 4.5, totalReviews: 19, totalSales: 71, deliveryFee: 200,
    products: [
      p('Golden Morn (Big Pack)', 'Grains & Cereals', 3800, 'Per pack', 35, 'Maize and soy breakfast cereal.'),
      p('Custard Powder (500g)', 'Grains & Cereals', 2200, 'Per pack', 45, 'Smooth custard, no lumps.'),
      p('Pap (Ogi) Pack', 'Grains & Cereals', 800, 'Per pack', 60, 'Fermented maize pap, ready to cook.'),
      p('Milo (Refill Pack)', 'Snacks & Beverages', 2600, 'Per pack', 40, 'Chocolate malt drink refill pack.'),
      p('Peak Milk Sachets (Pack)', 'Snacks & Beverages', 2000, 'Per pack', 50, 'Pack of powdered milk sachets.'),
      p('Gala Sausage Roll', 'Snacks & Beverages', 300, 'Per piece', 150, 'Everyone\'s favourite sausage roll.'),
    ],
  },
]

async function main() {
  console.log('Seeding sellers and products...')

  for (const s of SELLERS) {
    const email = `${s.slug}@seed.buylence.test`

    // 1) Seller's user account (cannot log in, no real Firebase account)
    const user = await prisma.user.upsert({
      where: { email },
      update: { fullName: s.owner, role: 'VENDOR' },
      create: {
        firebaseUid: `seed_${s.slug}`,
        email,
        fullName: s.owner,
        role: 'VENDOR',
      },
    })

    // 2) Vendor profile
    const vendorData = {
      storeName: s.storeName,
      description: s.description,
      hall: s.hall,
      storeType: s.storeType,
      categories: s.categories,
      onboarded: true,
      verified: true,
      rating: s.rating,
      totalReviews: s.totalReviews,
      totalSales: s.totalSales,
      deliveryFee: s.deliveryFee,
    }
    const vendor = await prisma.vendor.upsert({
      where: { userId: user.id },
      update: vendorData,
      create: { userId: user.id, ...vendorData },
    })

    // 3) Replace this seller's products
    await prisma.product.deleteMany({ where: { vendorId: vendor.id } })
    await prisma.product.createMany({
      data: s.products.map((prod, i) => ({
        vendorId: vendor.id,
        name: prod.name,
        description: prod.description,
        category: prod.category,
        unit: prod.unit,
        sku: `${s.slug.toUpperCase().slice(0, 4)}-${String(i + 1).padStart(3, '0')}`,
        price: prod.price,
        comparePrice: prod.comparePrice ?? null,
        stock: prod.stock,
        images: [img(prod.name)],
        availableHalls: s.delivers,
        flashDeal: prod.flashDeal || false,
        isActive: true,
      })),
    })

    console.log(`  ✓ ${s.storeName} (${s.hall}) — ${s.products.length} products`)
  }

  console.log('Done.')
}

main()
  .catch((err) => {
    console.error('Seed failed:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    process.exit()
  })