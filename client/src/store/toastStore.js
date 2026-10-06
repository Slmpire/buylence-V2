import { create } from 'zustand'

let nextId = 0

const useToastStore = create((set, get) => ({
  toasts: [],
  show: (message, type = 'success', duration = 4500) => {
    const id = ++nextId
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => get().dismiss(id), duration)
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// Use anywhere, no hooks needed: toast.success('Saved!')
export const toast = {
  success: (m) => useToastStore.getState().show(m, 'success'),
  error: (m) => useToastStore.getState().show(m, 'error', 6000),
  info: (m) => useToastStore.getState().show(m, 'info'),
}

export default useToastStore