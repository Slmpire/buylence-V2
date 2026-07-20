import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCartStore = create(persist(
  (set, get) => ({
    items: [],
    addItem: (product) => {
      const existing = get().items.find(i => i.id === product.id)
      if (existing) {
        set({ items: get().items.map(i =>
          i.id === product.id ? { ...i, qty: i.qty + 1 } : i
        )})
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
          qty: 1,
        }
        set({ items: [...get().items, item] })
      }
    },
    removeItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),
    updateQty: (id, qty) => {
      if (qty < 1) return get().removeItem(id)
      set({ items: get().items.map(i => i.id === id ? { ...i, qty } : i) })
    },
    clearCart: () => set({ items: [] }),
    get total() {
      return get().items.reduce((sum, i) => sum + i.price * i.qty, 0)
    },
  }),
  {
    name: 'buylence-cart',
    storage: {
      getItem: (name) => {
        try {
          const str = localStorage.getItem(name)
          return str ? JSON.parse(str) : null
        } catch { return null }
      },
      setItem: (name, value) => {
        try {
          localStorage.setItem(name, JSON.stringify(value))
        } catch {}
      },
      removeItem: (name) => localStorage.removeItem(name),
    },
  }
))
export default useCartStore