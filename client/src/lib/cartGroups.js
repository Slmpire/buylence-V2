// Splits cart lines into one group per store, and works out the money.
// Each store has its own delivery fee, so a cart from 3 stores pays 3 delivery fees.
export function groupByStore(items) {
  const map = new Map()

  for (const item of items) {
    const key = item.vendorId || 'unknown'

    if (!map.has(key)) {
      map.set(key, {
        vendorId: key,
        storeName: item.vendor?.storeName || 'Store',
        deliveryFee: null,
        items: [],
        subtotal: 0,
      })
    }

    const group = map.get(key)
    group.items.push(item)
    group.subtotal += item.price * item.qty

    // Use the store's real fee as soon as any line knows it
    if (group.deliveryFee === null && typeof item.vendor?.deliveryFee === 'number') {
      group.deliveryFee = item.vendor.deliveryFee
    }
    if (group.storeName === 'Store' && item.vendor?.storeName) {
      group.storeName = item.vendor.storeName
    }
  }

  // Lines added before the fee was saved fall back to 200. The server charges the real fee.
  const groups = [...map.values()].map(g => {
    const deliveryFee = g.deliveryFee ?? 200
    return { ...g, deliveryFee, total: g.subtotal + deliveryFee }
  })

  const subtotal = groups.reduce((sum, g) => sum + g.subtotal, 0)
  const delivery = groups.reduce((sum, g) => sum + g.deliveryFee, 0)

  return { groups, subtotal, delivery, total: subtotal + delivery }
}