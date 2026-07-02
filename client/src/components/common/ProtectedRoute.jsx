import { Navigate } from 'react-router-dom'
import useAuthStore from '../../store/authStore'


// Vendor only — must be logged in as vendor and onboarded    
export function VendorRoute({ children }) {
  const { isLoggedIn, user } = useAuthStore()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'vendor') {
    return <Navigate to="/" replace />
  }

  if (!user?.onboarded) {
    return <Navigate to="/vendor-onboarding" replace />
  }

  return children
}

// Rider only — must be logged in as rider
export function RiderRoute({ children }) {
  const { isLoggedIn, user } = useAuthStore()

  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (user?.role !== 'RIDER') return <Navigate to="/" replace />

  return children
}

// Admin only — must be logged in as admin
export function AdminRoute({ children }) {
  const { isLoggedIn, user } = useAuthStore()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}
// Authenticated users only — must be logged in
export function AuthRoute({ children }) {
  const { isLoggedIn } = useAuthStore()

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  return children
}