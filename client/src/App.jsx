import { Routes, Route } from 'react-router-dom'
import { useEffect, lazy, Suspense } from 'react'
import useAuthStore from './store/authStore'
import GlobalLoader, { PageLoader } from './components/common/GlobalLoader'
import { VendorRoute, AuthRoute, RiderRoute, AdminRoute } from './components/common/ProtectedRoute'
import Toaster from './components/common/Toaster'
import useCartStore from './store/cartStore'

const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/auth/Login'))
const Signup = lazy(() => import('./pages/auth/Signup'))
const Marketplace = lazy(() => import('./pages/marketplace/Marketplace'))
const Search = lazy(() => import('./pages/marketplace/Search'))
const Grains = lazy(() => import('./pages/categories/Grains'))
const Proteins = lazy(() => import('./pages/categories/Proteins'))
const Tubers = lazy(() => import('./pages/categories/Tubers'))
const Vegetables = lazy(() => import('./pages/categories/Vegetables'))
const Oils = lazy(() => import('./pages/categories/Oils'))
const Snacks = lazy(() => import('./pages/categories/Snacks'))
const Cart = lazy(() => import('./pages/checkout/Cart'))
const Checkout = lazy(() => import('./pages/checkout/Checkout'))
const Confirmation = lazy(() => import('./pages/checkout/Confirmation'))
const Orders = lazy(() => import('./pages/orders/Orders'))
const OrderDetail = lazy(() => import('./pages/orders/OrderDetail'))
const BuyerDashboard = lazy(() => import('./pages/dashboard/BuyerDashboard'))
const VendorOnboarding = lazy(() => import('./pages/onboarding/VendorOnboarding'))
const VendorPage = lazy(() => import('./pages/vendor/VendorPage'))
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'))
const VendorPlusDashboard = lazy(() => import('./pages/vendor/VendorPlusDashboard'))
const MyProducts = lazy(() => import('./pages/vendor-manage/MyProducts'))
const AddProduct = lazy(() => import('./pages/vendor-manage/AddProduct'))
const EditProduct = lazy(() => import('./pages/vendor-manage/EditProduct'))
const Earnings = lazy(() => import('./pages/vendor-manage/Earnings'))
const HallDelivery = lazy(() => import('./pages/vendor-manage/HallDelivery'))
const Settings = lazy(() => import('./pages/vendor-manage/Settings'))
const VendorsList = lazy(() => import('./pages/vendor/VendorsList'))
const Profile = lazy(() => import('./pages/dashboard/Profile'))
const UserSettings = lazy(() => import('./pages/dashboard/UserSettings'))
const RiderDashboard = lazy(() => import('./pages/rider/RiderDashboard'))
const RiderHistory = lazy(() => import('./pages/rider/RiderHistory'))
const RiderEarnings = lazy(() => import('./pages/rider/RiderEarnings'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))

export default function App() {
  const initAuth = useAuthStore(s => s.initAuth)
    const userId = useAuthStore(s => s.user?.id ?? null)
  const authLoading = useAuthStore(s => s.loading)
  const switchCartOwner = useCartStore(s => s.switchOwner)

  // Whenever the account changes (login, logout, switching users), load that account's cart
  useEffect(() => {
    if (!authLoading) switchCartOwner(userId)
  }, [userId, authLoading])

  useEffect(() => {
    const unsubscribe = initAuth()
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [])

  return (
    <>
      <GlobalLoader />
      <Toaster />
      <Suspense fallback={<PageLoader minHeight="100vh" />}>
        <Routes>
          {/* Public routes — anyone can access */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/search" element={<Search />} />
          <Route path="/category/grains" element={<Grains />} />
          <Route path="/category/proteins" element={<Proteins />} />
          <Route path="/category/tubers" element={<Tubers />} />
          <Route path="/category/vegetables" element={<Vegetables />} />
          <Route path="/category/oils" element={<Oils />} />
          <Route path="/category/snacks" element={<Snacks />} />
          <Route path="/vendors" element={<VendorsList />} />
          <Route path="/vendor/:id" element={<VendorPage />} />

          {/* Auth required — logged in users only */}
          <Route path="/profile" element={<AuthRoute><Profile /></AuthRoute>} />
          <Route path="/user-settings" element={<AuthRoute><UserSettings /></AuthRoute>} />
          <Route path="/cart" element={<AuthRoute><Cart /></AuthRoute>} />
          <Route path="/checkout" element={<AuthRoute><Checkout /></AuthRoute>} />
          <Route path="/order-confirmation" element={<AuthRoute><Confirmation /></AuthRoute>} />
          <Route path="/orders" element={<AuthRoute><Orders /></AuthRoute>} />
          <Route path="/orders/:id" element={<AuthRoute><OrderDetail /></AuthRoute>} />
          <Route path="/dashboard" element={<AuthRoute><BuyerDashboard /></AuthRoute>} />

          {/* Vendor only */}
          <Route path="/vendor-onboarding" element={<AuthRoute><VendorOnboarding /></AuthRoute>} />
          <Route path="/vendor/dashboard" element={<VendorRoute><VendorDashboard /></VendorRoute>} />
          <Route path="/vendor/dashboard/plus" element={<VendorRoute><VendorPlusDashboard /></VendorRoute>} />
          <Route path="/vendor/products" element={<VendorRoute><MyProducts /></VendorRoute>} />
          <Route path="/vendor/products/new" element={<VendorRoute><AddProduct /></VendorRoute>} />
          <Route path="/vendor/products/edit/:id" element={<VendorRoute><EditProduct /></VendorRoute>} />
          <Route path="/vendor/earnings" element={<VendorRoute><Earnings /></VendorRoute>} />
          <Route path="/vendor/delivery" element={<VendorRoute><HallDelivery /></VendorRoute>} />
          <Route path="/vendor/settings" element={<VendorRoute><Settings /></VendorRoute>} />

          {/* Rider only */}
          <Route path="/rider/dashboard" element={<RiderRoute><RiderDashboard /></RiderRoute>} />
          <Route path="/rider/history" element={<RiderRoute><RiderHistory /></RiderRoute>} />
          <Route path="/rider/earnings" element={<RiderRoute><RiderEarnings /></RiderRoute>} />

          {/* Admin only */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </Suspense>
    </>
  )
}