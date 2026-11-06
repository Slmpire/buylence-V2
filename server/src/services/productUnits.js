const MAX_UNITS = 8

// Check and tidy what the seller typed. Returns { units } or { error }.
function cleanUnits(input) {
  if (!Array.isArray(input) || input.length === 0) {
    return { error: 'Add at least one way to sell this product (for example: Pack).' }
  }
  if (input.length > MAX_UNITS) {
    return { error: `You can add up to ${MAX_UNITS} options per product.` }
  }

  const seen = new Set()
  const units = []

  for (const [index, raw] of input.entries()) {
    const label = String(raw?.label ?? '').trim()
    if (!label) return { error: `Option ${index + 1} needs a name (for example: Carton).` }
    if (label.length > 30) return { error: `"${label.slice(0, 12)}…" is too long. Keep option names under 30 characters.` }

    const key = label.toLowerCase()
    if (seen.has(key)) return { error: `"${label}" is listed twice.` }
    seen.add(key)

    const price = Number(raw.price)
    if (!Number.isInteger(price) || price <= 0) {
      return { error: `"${label}": the price must be a whole number of naira, above 0.` }
    }

    let comparePrice = null
    const hasCompare = raw.comparePrice !== '' && raw.comparePrice !== null && raw.comparePrice !== undefined
    if (hasCompare) {
      comparePrice = Number(raw.comparePrice)
      if (!Number.isInteger(comparePrice) || comparePrice <= 0) {
        return { error: `"${label}": the "was" price must be a whole number of naira.` }
      }
      // A "was" price only makes sense when it is higher than the real price
      if (comparePrice <= price) comparePrice = null
    }

    const hasStock = raw.stock !== '' && raw.stock !== null && raw.stock !== undefined
    const stock = hasStock ? Number(raw.stock) : 0
    if (!Number.isInteger(stock) || stock < 0) {
      return { error: `"${label}": stock must be a whole number, 0 or more.` }
    }

    units.push({ id: raw.id || undefined, label, price, comparePrice, stock, sortOrder: index })
  }

  return { units }
}

// The product itself mirrors its first option, so lists, filters and sorting keep working
function mirrorFields(units) {
  const first = units[0]
  return {
    price: first.price,
    comparePrice: first.comparePrice ?? null,
    stock: units.reduce((sum, u) => sum + u.stock, 0),
    unit: `Per ${first.label.toLowerCase()}`,
  }
}

// Recalculate the mirror from the live options. `client` is prisma or a transaction.
async function syncProductMirror(client, productId) {
  const units = await client.productUnit.findMany({
    where: { productId, isActive: true },
    orderBy: { sortOrder: 'asc' },
  })
  if (units.length === 0) return null
  return client.product.update({ where: { id: productId }, data: mirrorFields(units) })
}

module.exports = { cleanUnits, mirrorFields, syncProductMirror, MAX_UNITS }