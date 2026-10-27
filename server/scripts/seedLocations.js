const prisma = require('../src/utils/prisma')

// Names only. Add coordinates later (see notes below).
const LOCATIONS = [
  { name: 'Awo Hall', type: 'HALL' },
  { name: 'Moremi Hall', type: 'HALL' },
  { name: 'Fajuyi Hall', type: 'HALL' },
  { name: 'Mozambique Hall', type: 'HALL' },
  { name: 'Angola Hall', type: 'HALL' },
  { name: 'ETF Hall', type: 'HALL' },
  { name: 'Awolowo Hall', type: 'HALL' },
  { name: 'Akintola Hall', type: 'HALL' },
  { name: 'Main Gate', type: 'GATE' },
  { name: 'Off-Campus', type: 'OTHER' },
]

async function main() {
  for (const loc of LOCATIONS) {
    await prisma.location.upsert({
      where: { name: loc.name },
      update: {},
      create: loc,
    })
    console.log(`  ✓ ${loc.name}`)
  }
  console.log('Done.')
}

main()
  .catch((err) => { console.error(err); process.exitCode = 1 })
  .finally(async () => { await prisma.$disconnect(); process.exit() })