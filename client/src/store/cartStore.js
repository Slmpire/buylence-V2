import { create } from 'zustand'
import api from '../lib/axios'

const CART_PREFIX = 'buylence-cart:'
const SAVED_PREFIX = 'buylence-saved:'
const cartKeyFor = (userId) => CART_PREFIX + (userId || 'guest')
const savedKeyFor = (userId) => SAVED_PREFIX + (userId || 'guest')

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

// Combine two lists, adding up quantities for the same line
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
      const key = cartKeyFor(startOwner)
      save(key, mergeItems(load(key), normalize(legacy)))
    }
    localStorage.removeItem('buylence-cart')
  } catch {}
})()

const useCartStore = create((set, get) => ({
  items: load(cartKeyFor(startOwner)),
  saved: load(savedKeyFor(startOwner)), // "saved for later"
  ownerId: startOwner, // null = guest

  // Called whenever the signed-in account changes (see App.jsx)
  switchOwner: (userId) => {
    const prev = get().ownerId
    if (prev === userId) return

    let items = load(cartKeyFor(userId))
    let saved = load(savedKeyFor(userId))

    // Guest just signed in or signed up: keep what they added as a guest
    if (userId && prev === null) {
      const guestItems = load(cartKeyFor(null))
      const guestSaved = load(savedKeyFor(null))
      if (guestItems.length) {
        items = mergeItems(items, guestItems)
        try { localStorage.removeItem(cartKeyFor(null)) } catch {}
      }
      if (guestSaved.length) {
        saved = mergeItems(saved, guestSaved)
        try { localStorage.removeItem(savedKeyFor(null)) } catch {}
      }
    }

    set({ ownerId: userId, items, saved })
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
                unavailable: false,
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
    set({
      items: get().items.map((i) =>
        lineKey(i) === key ? { ...i, qty, priceWas: undefined } : i
      ),
    })
  },

  // Set a line aside for later: it leaves the cart and stops counting toward the total
  saveForLater: (key) => {
    const item = get().items.find((i) => lineKey(i) === key)
    if (!item) return
    set({
      items: get().items.filter((i) => lineKey(i) !== key),
      saved: mergeItems(get().saved, [item]),
    })
  },

  // Bring a saved line back into the cart
  moveToCart: (key) => {
    const item = get().saved.find((i) => lineKey(i) === key)
    if (!item) return
    set({
      saved: get().saved.filter((i) => lineKey(i) !== key),
      items: mergeItems(get().items, [{ ...item, unavailable: false }]),
    })
    // Its price or stock may have changed while it was saved
    get().refreshCart()
  },

  removeSaved: (key) => set({ saved: get().saved.filter((i) => lineKey(i) !== key) }),

  // Emptying the cart (after a purchase) leaves "saved for later" alone
  clearCart: () => set({ items: [] }),

  // Ask the server for today's price, stock and availability of every cart line
  refreshCart: async () => {
    const current = get().items
    if (current.length === 0) return

    try {
      const res = await api.post(
        '/cart/refresh',
        { items: current.map((i) => ({ key: lineKey(i), id: i.id, unitId: i.unitId })) },
        { silent: true }
      )
      const byKey = new Map((res.data.results || []).map((r) => [r.key, r]))

      let next = get().items.map((i) => {
        const r = byKey.get(lineKey(i))
        if (!r) return i // added while we were waiting: leave it alone

        if (r.status !== 'ok') return { ...i, unavailable: true }

        const priceChanged = typeof i.price === 'number' && r.price !== i.price
        const updated = {
          ...i,
          unavailable: false,
          unitId: r.unitId,
          unitLabel: r.unitLabel,
          price: r.price,
          comparePrice: r.comparePrice,
          stock: r.stock,
          priceWas: priceChanged ? i.price : i.priceWas,
          vendor: i.vendor && r.deliveryFee !== null
            ? { ...i.vendor, deliveryFee: r.deliveryFee }
            : i.vendor,
        }
        updated.key = `${i.id}:${r.unitId}`
        return updated
      })

      // An old line without an option may now match one that already exists: merge them
      next = mergeItems([], next)
      set({ items: next })
    } catch {
      // Offline or the server is down: keep showing what we have
    }
  },
}))

// Save both lists under the CURRENT owner's keys after every change
useCartStore.subscribe((state) => {
  save(cartKeyFor(state.ownerId), state.items)
  save(savedKeyFor(state.ownerId), state.saved)
})

export default useCartStore