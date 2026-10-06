import { create } from 'zustand'

const PREFIX = 'buylence-cart:'
const keyFor = (userId) => PREFIX + (userId || 'guest')

function load(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key))
    return Array.isArray(v) ? v : []
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
  const map = new Map(base.map((i) => [i.id, { ...i }]))
  for (const it of extra) {
    if (map.has(it.id)) map.get(it.id).qty += it.qty
    else map.set(it.id, { ...it })
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

// One-time migration: carts saved by the old version go to the current owner
;(function migrateLegacyCart() {
  try {
    const raw = localStorage.getItem('buylence-cart')
    if (!raw) return
    const legacy = JSON.parse(raw)?.state?.items
    if (Array.isArray(legacy) && legacy.length) {
      const key = keyFor(startOwner)
      save(key, mergeItems(load(key), legacy))
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

  addItem: (product, count = 1) => {
    const existing = get().items.find((i) => i.id === product.id)
    if (existing) {
      set({
        items: get().items.map((i) =>
          i.id === product.id ? { ...i, qty: i.qty + count } : i
        ),
      })
    } else {
      // Only store what we need — avoid non-serializable nested objects
      const item = {
        id: product.id,
        name: product.name,
        price: product.price,
        images: product.images,
        img: product.img,
        unit: product.unit,
        vendorId: product.vendorId,
        vendor: product.vendor,
        qty: count,
      }
      set({ items: [...get().items, item] })
    }
  },

  removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),

  updateQty: (id, qty) => {
    if (qty < 1) return get().removeItem(id)
    set({ items: get().items.map((i) => (i.id === id ? { ...i, qty } : i)) })
  },

  clearCart: () => set({ items: [] }),
}))

// Save the cart under the CURRENT owner's key after every change
useCartStore.subscribe((state) => save(keyFor(state.ownerId), state.items))

export default useCartStore