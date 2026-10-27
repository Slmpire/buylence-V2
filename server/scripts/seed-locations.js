const prisma = require('../src/utils/prisma')

const AREA_CAMPUS = 'OAU Campus'
const AREA_TOWN = 'Ile-Ife (Off-campus)'

const LOCATIONS = [
  // Halls of residence
  { name: 'Awo Hall', area: AREA_CAMPUS, type: 'HALL' },
  { name: 'Moremi Hall', area: AREA_CAMPUS, type: 'HALL' },
  { name: 'Fajuyi Hall', area: AREA_CAMPUS, type: 'HALL' },
  { name: 'Mozambique Hall', area: AREA_CAMPUS, type: 'HALL' },
  { name: 'Angola Hall', area: AREA_CAMPUS, type: 'HALL' },
  { name: 'ETF Hall', area: AREA_CAMPUS, type: 'HALL' },
  { name: 'Awolowo Hall', area: AREA_CAMPUS, type: 'HALL' },
  { name: 'Akintola Hall', area: AREA_CAMPUS, type: 'HALL' },

  // Other places on campus
  { name: 'Main Gate', area: AREA_CAMPUS, type: 'GATE' },
  { name: 'Student Union Building (SUB)', area: AREA_CAMPUS, type: 'LANDMARK' },
  { name: 'Hezekiah Oluwasanmi Library', area: AREA_CAMPUS, type: 'LANDMARK' },
  { name: 'Faculty of Technology', area: AREA_CAMPUS, type: 'FACULTY' },

  // Off campus
  { name: 'Off-Campus (Ile-Ife town)', area: AREA_TOWN, type: 'OFF_CAMPUS' },
]

async function main() {
  console.log('Seeding locations...')
  for (const loc of LOCATIONS) {
    await prisma.location.upsert({
      where: { name: loc.name },
      update: {},               // never overwrite edits made by an admin
      create: loc,
    })
    console.log(`  ✓ ${loc.name}`)
  }
  console.log('Done. Add coordinates at /admin/locations.')
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