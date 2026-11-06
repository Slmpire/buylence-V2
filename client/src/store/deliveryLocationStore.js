import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// location = { name, latitude, longitude } or null
const useDeliveryLocation = create(
  persist(
    (set) => ({
      location: null,
      setLocation: (loc) =>
        set({
          location: loc && loc.name
            ? {
                name: loc.name,
                latitude: loc.latitude ?? null,
                longitude: loc.longitude ?? null,
              }
            : null,
        }),
    }),
    { name: 'buylence-delivery-location' }
  )
)

export default useDeliveryLocation