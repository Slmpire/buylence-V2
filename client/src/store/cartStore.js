import { create } from 'zustand'

const PREFIX = 'buylence-cart:'
const keyFor = (userId) => PREFIX + (userId || 'guest')

// One cart line = one product in one option (e.g. Indomie / Carton)
const lineKey = (i) => i.key || (i.unitId ? `${i.id}:${i.unitId}` : i.id)

// Make sure every saved line has a key (carts saved before options existed don't)
function normalize(items) {
  return items.map(i => ({ ...i, key: lineKey(i) }))
}

function load(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key))
    return Array.isArray(v) ? normalize(v) : []
  } catch {
    return []
  }
}

function save(key, items) {
  try {
    localStorage.setItem(key, JSON.stringify(items))
  } catch {}
}

function mergeItems(base, extra) {
  const map = new Map(base.map((i) => [lineKey(i), { ...i }]))
  for (const it of extra) {
    const k = lineKey(it)
    if (map.has(k)) map.get(k).qty += it.qty
    else map.set(k, { ...it, key: k })
  }
  return [...map.values()]
}

// Who was signed in last time? (read from the persisted auth store)
function initialOwner() {
  try {
    return JSON.parse(localStorage.getItem('buylence-auth'))?.state?.user?.id ?? null
  } catch {
    return null
  }
}

const startOwner = initialOwner()

// One-time migration: carts saved by the very first version go to the current owner
;(function migrateLegacyCart() {
  try {
    const raw = localStorage.getItem('buylence-cart')
    if (!raw) return
    const legacy = JSON.parse(raw)?.state?.items
    if (Array.isArray(legacy) && legacy.length) {
      const key = keyFor(startOwner)
      save(key, mergeItems(load(key), normalize(legacy)))
    }
    localStorage.removeItem('buylence-cart')
  } catch {}
})()

const useCartStore = create((set, get) => ({
  items: load(keyFor(startOwner)),
  ownerId: startOwner, // null = guest

  // Called whenever the signed-in account changes (see App.jsx)
  switchOwner: (userId) => {
    const prev = get().ownerId
    if (prev === userId) return

    let items = load(keyFor(userId))

    // Guest just signed in or signed up: keep what they added as a guest
    if (userId && prev === null) {
      const guestItems = load(keyFor(null))
      if (guestItems.length) {
        items = mergeItems(items, guestItems)
        try { localStorage.removeItem(keyFor(null)) } catch {}
      }
    }

    set({ ownerId: userId, items })
  },

  // addItem(product, count, unit)
  //   unit = the chosen option ({ id, label, price, comparePrice, stock }).
  //   If it is left out, the product's first option is used.
  addItem: (product, count = 1, unit = null) => {
    const chosen = unit || (Array.isArray(product.units) ? product.units[0] : null) || null
    const key = chosen?.id ? `${product.id}:${chosen.id}` : product.id

    const existing = get().items.find((i) => lineKey(i) === key)
    if (existing) {
      set({
        items: get().items.map((i) =>
          lineKey(i) === key
            ? {
                ...i,
                qty: i.qty + count,
                // Refresh what we know about this option each time it is added
                price: chosen ? chosen.price : i.price,
                stock: chosen ? chosen.stock : i.stock,
              }
            : i
        ),
      })
      return
    }

    // Only store what we need — avoid non-serializable nested objects
    const item = {
      key,
      id: product.id,
      unitId: chosen?.id || null,
      unitLabel: chosen?.label || null,
      name: product.name,
      price: chosen ? chosen.price : product.price,
      comparePrice: chosen ? chosen.comparePrice : product.comparePrice,
      stock: chosen ? chosen.stock : product.stock,
      images: product.images,
      img: product.img,
      unit: product.unit,
      vendorId: product.vendorId,
      vendor: product.vendor,
      description: product.description,
      availableHalls: product.availableHalls,
      category: product.category,
      qty: count,
    }
    set({ items: [...get().items, item] })
  },

  // Cart pages pass the line key (item.key)
  removeItem: (key) => set({ items: get().items.filter((i) => lineKey(i) !== key) }),

  updateQty: (key, qty) => {
    if (qty < 1) return get().removeItem(key)
    set({ items: get().items.map((i) => (lineKey(i) === key ? { ...i, qty } : i)) })
  },

  clearCart: () => set({ items: [] }),
}))

// Save the cart under the CURRENT owner's key after every change
useCartStore.subscribe((state) => save(keyFor(state.ownerId), state.items))

export default useCartStore