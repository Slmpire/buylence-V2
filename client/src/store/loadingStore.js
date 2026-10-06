import { create } from 'zustand'

// Counts in-flight API requests so the loader stays visible
// until ALL of them have finished.
const useLoadingStore = create((set) => ({
  pending: 0,
  start: () => set((s) => ({ pending: s.pending + 1 })),
  stop: () => set((s) => ({ pending: Math.max(0, s.pending - 1) })),
}))

export default useLoadingStore