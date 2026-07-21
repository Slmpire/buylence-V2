require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding Buylence database...')

  // ─────────────────────────────────────────────────────
  // USERS
  // ─────────────────────────────────────────────────────

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@buylence.com' },
    update: {},
    create: {
      firebaseUid: 'seed-admin-uid-001',
      email: 'admin@buylence.com',
      fullName: 'Buylence Admin',
      phone: '08000000000',
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin created:', admin.email)

  // Vendor user 1
  const vendorUser1 = await prisma.user.upsert({
    where: { email: 'tunde@buylence.com' },
    update: {},
    create: {
      firebaseUid: 'seed-vendor-uid-001',
      email: 'tunde@buylence.com',
      fullName: 'Tunde Bakare',
      phone: '08012345678',
      role: 'VENDOR',
      hall: 'Moremi Hall',
      room: 'Block B, Room 12',
    },
  })

  // Vendor user 2
  const vendorUser2 = await prisma.user.upsert({
    where: { email: 'moremi@buylence.com' },
    update: {},
    create: {
      firebaseUid: 'seed-vendor-uid-002',
      email: 'moremi@buylence.com',
      fullName: 'Amaka Obi',
      phone: '08098765432',
      role: 'VENDOR',
      hall: 'Fajuyi Hall',
      room: 'Frontage Shop',
    },
  })

  // Buyer user
  const buyerUser = await prisma.user.upsert({
    where: { email: 'pelumi@buylence.com' },
    update: {},
    create: {
      firebaseUid: 'seed-buyer-uid-001',
      email: 'pelumi@buylence.com',
      fullName: 'Pelumi Adewale',
      phone: '08055443322',
      role: 'BUYER',
      hall: 'Awo Hall',
      room: 'Block A, Room 12',
      matric: 'ENG/2021/001',
    },
  })
  console.log('✅ Users created')

  // Rider user
  const riderUser = await prisma.user.upsert({
    where: { email: 'rider1@buylence.com' },
    update: {},
    create: {
      firebaseUid: 'seed-rider-uid-001',
      email: 'rider1@buylence.com',
      fullName: 'Chidi Okafor',
      phone: '08077889900',
      role: 'RIDER',
    },
  })

  const riderUser2 = await prisma.user.upsert({
    where: { email: 'rider2@buylence.com' },
    update: {},
    create: {
      firebaseUid: 'seed-rider-uid-002',
      email: 'rider2@buylence.com',
      fullName: 'Emeka Nwosu',
      phone: '08033221100',
      role: 'RIDER',
    },
  })
  console.log('✅ Rider users created')

  // ─────────────────────────────────────────────────────
  // VENDORS
  // ─────────────────────────────────────────────────────

  const vendor1 = await prisma.vendor.upsert({
    where: { userId: vendorUser1.id },
    update: {},
    create: {
      userId: vendorUser1.id,
      storeName: "Tunde's Fresh Mart",
      description: 'Premium groceries sourced fresh daily for the OAU community.',
      hall: 'Moremi Hall',
      storeType: 'PHYSICAL_KIOSK',
      categories: ['Grains & Cereals', 'Proteins & Meat', 'Tubers & Roots'],
      verified: true,
      onboarded: true,
      deliveryFee: 200,
      rating: 4.8,
      totalReviews: 124,
      totalSales: 340,
    },
  })

  const vendor2 = await prisma.vendor.upsert({
    where: { userId: vendorUser2.id },
    update: {},
    create: {
      userId: vendorUser2.id,
      storeName: 'Moremi Delights',
      description: 'Artisanal pastries and beverages crafted fresh every morning.',
      hall: 'Fajuyi Hall',
      storeType: 'PHYSICAL_KIOSK',
      categories: ['Snacks & Beverages', 'Bread & Bakery', 'Beverages & Drinks'],
      verified: true,
      onboarded: true,
      deliveryFee: 200,
      rating: 4.6,
      totalReviews: 89,
      totalSales: 210,
    },
  })
  console.log('✅ Vendors created')

  // ─────────────────────────────────────────────────────
  // RIDERS
  // ─────────────────────────────────────────────────────

  await prisma.rider.upsert({
    where: { userId: riderUser.id },
    update: {},
    create: {
      userId: riderUser.id,
      vehicleType: 'Bicycle',
      isActive: true,
      totalDeliveries: 47,
    },
  })

  await prisma.rider.upsert({
    where: { userId: riderUser2.id },
    update: {},
    create: {
      userId: riderUser2.id,
      vehicleType: 'Motorcycle',
      isActive: true,
      totalDeliveries: 82,
    },
  })
  console.log('✅ Riders created')

  // ─────────────────────────────────────────────────────
  // PRODUCTS — Vendor 1
  // ─────────────────────────────────────────────────────

  const vendor1Products = [
    {
      name: 'Ofada Rice (1kg)',
      description: 'Local unpolished rice, farm fresh from Ile-Ife farmers.',
      category: 'Grains & Cereals',
      unit: 'Per kg',
      sku: 'BL-GR-001',
      price: 3200,
      comparePrice: 3800,
      stock: 50,
      // Ofada Rice (1kg)
      images: ['https://images.unsplash.com/photo-1536304993881-ff86e0c9b516?w=400&q=80'],
      availableHalls: ['Awo Hall', 'Moremi Hall', 'Fajuyi Hall', 'ETF Hall'],
      flashDeal: false,
    },
    {
      name: 'Brown Rice (1kg)',
      description: 'Organic whole grain brown rice, high in fiber.',
      category: 'Grains & Cereals',
      unit: 'Per kg',
      sku: 'BL-GR-002',
      price: 3500,
      comparePrice: null,
      stock: 35,
      // Brown Rice (1kg)
      images: ['https://images.unsplash.com/photo-1626016761073-1e1b3f07af15?w=400&q=80'],
      availableHalls: ['Awo Hall', 'Moremi Hall', 'Fajuyi Hall', 'ETF Hall', 'Angola Hall'],
      flashDeal: false,
    },
    {
      name: 'Yam Tubers (3kg)',
      description: 'Fresh yam tubers sourced directly from the farm.',
      category: 'Tubers & Roots',
      unit: 'Per bundle',
      sku: 'BL-TB-001',
      price: 4200,
      comparePrice: 5000,
      stock: 20,
      // Yam Tubers (3kg)
      images: ['https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&q=80'],
      availableHalls: ['Awo Hall', 'Moremi Hall', 'Fajuyi Hall'],
      flashDeal: true,
    },
    {
      name: 'Fresh Tilapia Fish (1kg)',
      description: 'Market fresh tilapia, cleaned and ready to cook.',
      category: 'Proteins & Meat',
      unit: 'Per kg',
      sku: 'BL-PR-001',
      price: 5500,
      comparePrice: null,
      stock: 15,
      // Fresh Tilapia Fish (1kg)
      images: ['https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&q=80'],
      availableHalls: ['Awo Hall', 'Moremi Hall'],
      flashDeal: false,
    },
    {
      name: 'Frozen Chicken (1kg)',
      description: 'Grade A frozen chicken, properly stored and packaged.',
      category: 'Proteins & Meat',
      unit: 'Per kg',
      sku: 'BL-PR-002',
      price: 6500,
      comparePrice: 7200,
      stock: 25,
      images: ['https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&q=80'],
      availableHalls: ['Awo Hall', 'Moremi Hall', 'Fajuyi Hall', 'ETF Hall'],
      flashDeal: false,
    },
    {
      name: 'Groundnut Oil (75cl)',
      description: 'Cold pressed groundnut oil from local farmers.',
      category: 'Oils & Spices',
      unit: 'Per litre',
      sku: 'BL-OL-001',
      price: 2400,
      comparePrice: null,
      stock: 40,
      // Groundnut Oil (75cl)
      images: ['https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80'],
      availableHalls: ['Awo Hall', 'Moremi Hall', 'Fajuyi Hall', 'ETF Hall', 'Angola Hall'],
      flashDeal: false,
    },
    {
      name: 'Sweet Potato (2kg)',
      description: 'Fresh sweet potatoes, great for porridge or frying.',
      category: 'Tubers & Roots',
      unit: 'Per kg',
      sku: 'BL-TB-002',
      price: 2200,
      comparePrice: null,
      stock: 30,
      // Sweet Potato (2kg)
      images: ['https://images.unsplash.com/photo-1596097635121-14b38bfd248c?w=400&q=80'],
      availableHalls: ['Awo Hall', 'Moremi Hall', 'Fajuyi Hall'],
      flashDeal: false,
    },
    {
      name: 'Garri (5kg)',
      description: 'Ijebu white garri, fine grade. The campus essential.',
      category: 'Grains & Cereals',
      unit: 'Per pack',
      sku: 'BL-GR-003',
      price: 5500,
      comparePrice: 6000,
      stock: 60,
      // Garri (5kg)
      images: ['https://images.unsplash.com/photo-1612257417666-f4b8c14a7987?w=400&q=80'],
      availableHalls: ['Awo Hall', 'Moremi Hall', 'Fajuyi Hall', 'ETF Hall', 'Angola Hall', 'Mozambique Hall'],
      flashDeal: true,
    },
  ]

  for (const product of vendor1Products) {
    await prisma.product.create({
      data: { vendorId: vendor1.id, ...product },
    })
  }
  console.log(`✅ ${vendor1Products.length} products created for Tunde's Fresh Mart`)

  // ─────────────────────────────────────────────────────
  // PRODUCTS — Vendor 2
  // ─────────────────────────────────────────────────────

  const vendor2Products = [
    {
      name: 'Butter Croissant',
      description: 'Baked fresh every morning. Flaky, buttery, and warm.',
      category: 'Bread & Bakery',
      unit: 'Per piece',
      sku: 'BL-BK-001',
      price: 1200,
      comparePrice: null,
      stock: 30,
      // Butter Croissant
      images: ['https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80'],
      availableHalls: ['Moremi Hall', 'Fajuyi Hall', 'Awo Hall'],
      flashDeal: false,
    },
    {
      name: 'Vanilla Cold Brew (500ml)',
      description: 'Smooth cold brew with a hint of vanilla. Large cup.',
      category: 'Beverages & Drinks',
      unit: 'Per piece',
      sku: 'BL-BV-001',
      price: 1500,
      comparePrice: null,
      stock: 20,
      // Vanilla Cold Brew (500ml)
      images: ['https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80'],
      availableHalls: ['Moremi Hall', 'Fajuyi Hall', 'Awo Hall', 'ETF Hall'],
      flashDeal: false,
    },
    {
      name: 'Chin Chin (200g)',
      description: 'Crispy and fresh chin chin, made in-house daily.',
      category: 'Snacks & Beverages',
      unit: 'Per pack',
      sku: 'BL-SN-001',
      price: 800,
      comparePrice: null,
      stock: 50,
      // Chin Chin (200g)
      images: ['https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&q=80'],
      availableHalls: ['Moremi Hall', 'Fajuyi Hall', 'Awo Hall', 'ETF Hall', 'Angola Hall'],
      flashDeal: false,
    },
    {
      name: 'Puff Puff (10 pieces)',
      description: 'Hot and fresh puff puff. Order before 2pm for same-day delivery.',
      category: 'Snacks & Beverages',
      unit: 'Per pack',
      sku: 'BL-SN-002',
      price: 600,
      comparePrice: null,
      stock: 40,
      // Puff Puff (10 pieces)
      images: ['https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80'],
      availableHalls: ['Moremi Hall', 'Fajuyi Hall'],
      flashDeal: true,
    },
    {
      name: 'Zobo Drink (1L)',
      description: 'Chilled hibiscus zobo with ginger and pineapple flavour.',
      category: 'Beverages & Drinks',
      unit: 'Per litre',
      sku: 'BL-BV-002',
      price: 1000,
      comparePrice: 1200,
      stock: 25,
      // Zobo Drink (1L)
      images: ['https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80'],
      availableHalls: ['Moremi Hall', 'Fajuyi Hall', 'Awo Hall', 'ETF Hall'],
      flashDeal: false,
    },
  ]

  for (const product of vendor2Products) {
    await prisma.product.create({
      data: { vendorId: vendor2.id, ...product },
    })
  }
  console.log(`✅ ${vendor2Products.length} products created for Moremi Delights`)

  // ─────────────────────────────────────────────────────
  // SAMPLE ORDER — for testing the full lifecycle
  // ─────────────────────────────────────────────────────

  const sampleOrder = await prisma.order.create({
    data: {
      orderNumber: 'BUY-SEED01',
      buyerId: buyerUser.id,
      vendorId: vendor1.id,
      status: 'PLACED',
      deliveryHall: 'Awo Hall',
      deliveryRoom: 'Block A, Room 12',
      recipientName: 'Pelumi Adewale',
      recipientPhone: '08055443322',
      subtotal: 7400,
      deliveryFee: 200,
      total: 7600,
      paymentMethod: 'PAYSTACK',
      paymentStatus: 'HELD_IN_ESCROW',
      paystackRef: 'BUY-SEED01-TEST',
      items: {
        create: [
          {
            productId: (await prisma.product.findFirst({
              where: { vendorId: vendor1.id, sku: 'BL-GR-001' },
            })).id,
            name: 'Ofada Rice (1kg)',
            price: 3200,
            quantity: 1,
          },
          {
            productId: (await prisma.product.findFirst({
              where: { vendorId: vendor1.id, sku: 'BL-TB-001' },
            })).id,
            name: 'Yam Tubers (3kg)',
            price: 4200,
            quantity: 1,
          },
        ],
      },
    },
    include: { items: true },
  })
  console.log('✅ Sample order created:', sampleOrder.orderNumber)

  console.log('')
  console.log('🎉 Seed complete! Summary:')
  console.log('   Admin:    admin@buylence.com')
  console.log('   Vendor 1: tunde@buylence.com  → Tunde\'s Fresh Mart (8 products)')
  console.log('   Vendor 2: moremi@buylence.com → Moremi Delights (5 products)')
  console.log('   Buyer:    pelumi@buylence.com')
  console.log('   Rider 1:  rider1@buylence.com → Chidi Okafor (Bicycle)')
  console.log('   Rider 2:  rider2@buylence.com → Emeka Nwosu (Motorcycle)')
  console.log('   Sample order: BUY-SEED01 (PLACED, escrow held)')
  console.log('')
  console.log('⚠️  Note: Firebase UIDs in seed are placeholders.')
  console.log('   Real users must sign in via Firebase to get real UIDs.')
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })