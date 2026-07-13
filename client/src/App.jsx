import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import Home from './pages/Home'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Marketplace from './pages/marketplace/Marketplace'
import Search from './pages/marketplace/Search'
import Grains from './pages/categories/Grains'
import Proteins from './pages/categories/Proteins'
import Tubers from './pages/categories/Tubers'
import Vegetables from './pages/categories/Vegetables'
import Oils from './pages/categories/Oils'
import Cart from './pages/checkout/Cart'
import Checkout from './pages/checkout/Checkout'
import Confirmation from './pages/checkout/Confirmation'
import Orders from './pages/orders/Orders'
import OrderDetail from './pages/orders/OrderDetail'
import BuyerDashboard from './pages/dashboard/BuyerDashboard'
import VendorOnboarding from './pages/onboarding/VendorOnboarding'
import VendorPage from './pages/vendor/VendorPage'
import VendorDashboard from './pages/vendor/VendorDashboard'
import VendorPlusDashboard from './pages/vendor/VendorPlusDashboard'
import MyProducts from './pages/vendor-manage/MyProducts'
import AddProduct from './pages/vendor-manage/AddProduct'
import Earnings from './pages/vendor-manage/Earnings'
import HallDelivery from './pages/vendor-manage/HallDelivery'
import Settings from './pages/vendor-manage/Settings'
import VendorsList from './pages/vendor/VendorsList'
import Profile from './pages/dashboard/Profile'
import UserSettings from './pages/dashboard/UserSettings'
import RiderDashboard from './pages/rider/RiderDashboard'
import RiderHistory from './pages/rider/RiderHistory'
import RiderEarnings from './pages/rider/RiderEarnings'
import AdminDashboard from './pages/admin/AdminDashboard'
import { VendorRoute, AuthRoute, RiderRoute, AdminRoute } from './components/common/ProtectedRoute'
import EditProduct from './pages/vendor-manage/EditProduct'


export default function App() {
  const initAuth = useAuthStore(s => s.initAuth)

  useEffect(() => {

    const unsubscribe = initAuth()

    return () => {

      if (typeof unsubscribe === 'function') unsubscribe()

    }

  }, [])

  return (
    <Routes>
      // Public routes — anyone can access
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
<Route path="/vendors" element={<VendorsList />} />
<Route path="/vendor/:id" element={<VendorPage />} />
<Route path="/profile" element={<AuthRoute><Profile /></AuthRoute>} />
<Route path="/user-settings" element={<AuthRoute><UserSettings /></AuthRoute>} />

// Auth required — logged in users only
<Route path="/cart" element={<AuthRoute><Cart /></AuthRoute>} />
<Route path="/checkout" element={<AuthRoute><Checkout /></AuthRoute>} />
<Route path="/order-confirmation" element={<AuthRoute><Confirmation /></AuthRoute>} />
<Route path="/orders" element={<AuthRoute><Orders /></AuthRoute>} />
<Route path="/orders/:id" element={<AuthRoute><OrderDetail /></AuthRoute>} />
<Route path="/dashboard" element={<AuthRoute><BuyerDashboard /></AuthRoute>} />

// Vendor only — must be logged in as vendor
<Route path="/vendor-onboarding" element={<AuthRoute><VendorOnboarding /></AuthRoute>} />
<Route path="/vendor/dashboard" element={<VendorRoute><VendorDashboard /></VendorRoute>} />
<Route path="/vendor/dashboard/plus" element={<VendorRoute><VendorPlusDashboard /></VendorRoute>} />
<Route path="/vendor/products" element={<VendorRoute><MyProducts /></VendorRoute>} />
<Route path="/vendor/products/new" element={<VendorRoute><AddProduct /></VendorRoute>} />
<Route path="/vendor/products/edit/:id" element={<VendorRoute><EditProduct /></VendorRoute>} />
<Route path="/vendor/earnings" element={<VendorRoute><Earnings /></VendorRoute>} />
<Route path="/vendor/delivery" element={<VendorRoute><HallDelivery /></VendorRoute>} />
<Route path="/vendor/settings" element={<VendorRoute><Settings /></VendorRoute>} />

// Rider only — must be logged in as rider
<Route path="/rider/dashboard" element={<RiderRoute><RiderDashboard /></RiderRoute>} />
<Route path="/rider/history" element={<RiderRoute><RiderHistory /></RiderRoute>} />
<Route path="/rider/earnings" element={<RiderRoute><RiderEarnings /></RiderRoute>} />

// Admin only — must be logged in as admin
<Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
    </Routes>
  )
}