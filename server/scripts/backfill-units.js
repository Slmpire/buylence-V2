const prisma = require('../src/utils/prisma')

// "Per kg" -> "Kg", "Per pack" -> "Pack"
function labelFrom(unit) {
  const base = String(unit || '').replace(/^per\s+/i, '').trim() || 'piece'
  return base.charAt(0).toUpperCase() + base.slice(1)
}

async function main() {
  const products = await prisma.product.findMany({ where: { units: { none: {} } } })
  console.log(`Products without options: ${products.length}`)

  for (const p of products) {
    await prisma.productUnit.create({
      data: {
        productId: p.id,
        label: labelFrom(p.unit),
        price: Math.round(p.price),
        comparePrice: p.comparePrice ? Math.round(p.comparePrice) : null,
        stock: p.stock || 0,
        sortOrder: 0,
      },
    })
    console.log(`  ✓ ${p.name}`)
  }
  console.log('Done.')
}

main()
  .catch((err) => {
    console.error('Backfill failed:', err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    process.exit()
  })