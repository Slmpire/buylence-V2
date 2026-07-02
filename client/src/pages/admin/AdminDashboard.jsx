import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Users, ShoppingBag, Store, Truck, DollarSign,
  CheckCircle, XCircle, ToggleLeft, ToggleRight,
  Plus, LogOut, Menu, X,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'

const TABS = ['Overview', 'Vendors', 'Riders', 'Orders', 'Users']

const STATUS_BADGE = {
  PLACED: { label: 'Placed', color: '#D97706', bg: '#FFFBEB' },
  PREPARING: { label: 'Preparing', color: '#2563EB', bg: '#EFF6FF' },
  READY_FOR_PICKUP: { label: 'Ready', color: '#C2410C', bg: '#FFF7ED' },
  ASSIGNED_TO_RIDER: { label: 'In Transit', color: '#7C3AED', bg: '#F5F3FF' },
  PICKED_UP: { label: 'In Transit', color: '#7C3AED', bg: '#F5F3FF' },
  DELIVERED_BY_RIDER: { label: 'Delivered', color: '#16A34A', bg: '#F0FDF4' },
  CONFIRMED_BY_BUYER: { label: 'Completed', color: '#16A34A', bg: '#F0FDF4' },
  CANCELLED: { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2' },
}

const ROLE_BADGE = {
  BUYER: { label: 'Buyer', color: '#2563EB', bg: '#EFF6FF' },
  VENDOR: { label: 'Vendor', color: '#D97706', bg: '#FFFBEB' },
  RIDER: { label: 'Rider', color: '#7C3AED', bg: '#F5F3FF' },
  ADMIN: { label: 'Admin', color: '#DC2626', bg: '#FEF2F2' },
}

export default function AdminDashboard() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [activeTab, setActiveTab] = useState('Overview')
  const [menuOpen, setMenuOpen] = useState(false)

  // Data state
  const [stats, setStats] = useState(null)
  const [vendors, setVendors] = useState([])
  const [riders, setRiders] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // Rider form
  const [showRiderForm, setShowRiderForm] = useState(false)
  const [riderForm, setRiderForm] = useState({ firebaseUid: '', fullName: '', email: '', phone: '', vehicleType: 'Bicycle' })
  const [riderSaving, setRiderSaving] = useState(false)
  const [riderError, setRiderError] = useState('')

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [vendorsRes, ridersRes, ordersRes, usersRes] = await Promise.all([
        api.get('/vendors'),
        api.get('/riders'),
        api.get('/orders/admin/all').catch(() => ({ data: { orders: [] } })),
        api.get('/auth/users').catch(() => ({ data: { users: [] } })),
      ])

      const vendorList = vendorsRes.data.vendors || []
      const riderList = ridersRes.data.riders || []
      const orderList = ordersRes.data.orders || []
      const userList = usersRes.data.users || []

      setVendors(vendorList)
      setRiders(riderList)
      setOrders(orderList)
      setUsers(userList)

      // Compute stats
      const totalRevenue = orderList
        .filter(o => o.paymentStatus === 'RELEASED')
        .reduce((s, o) => s + (o.total || 0), 0)

      setStats({
        totalUsers: userList.length,
        totalVendors: vendorList.length,
        totalRiders: riderList.length,
        totalOrders: orderList.length,
        activeOrders: orderList.filter(o => !['CONFIRMED_BY_BUYER', 'CANCELLED'].includes(o.status)).length,
        totalRevenue,
        verifiedVendors: vendorList.filter(v => v.verified).length,
        activeRiders: riderList.filter(r => r.isActive).length,
      })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function toggleVendorVerified(vendorId, current) {
    try {
      await api.patch(`/vendors/${vendorId}/verify`, { verified: !current })
      setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, verified: !current } : v))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update vendor.')
    }
  }

  async function toggleRiderActive(riderId, current) {
    try {
      await api.patch(`/riders/${riderId}/toggle-active`)
      setRiders(prev => prev.map(r => r.id === riderId ? { ...r, isActive: !current } : r))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update rider.')
    }
  }

  async function addRider() {
    if (!riderForm.firebaseUid || !riderForm.fullName || !riderForm.email) {
      return setRiderError('Firebase UID, name and email are required.')
    }
    setRiderSaving(true)
    setRiderError('')
    try {
      await api.post('/riders', riderForm)
      setShowRiderForm(false)
      setRiderForm({ firebaseUid: '', fullName: '', email: '', phone: '', vehicleType: 'Bicycle' })
      await fetchAll()
    } catch (err) {
      setRiderError(err.response?.data?.error || 'Failed to add rider.')
    } finally {
      setRiderSaving(false)
    }
  }

  async function deleteRider(riderId) {
    if (!confirm('Remove this rider from the delivery team?')) return
    try {
      await api.delete(`/riders/${riderId}`)
      setRiders(prev => prev.filter(r => r.id !== riderId))
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove rider.')
    }
  }

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid rgba(0,0,0,0.07)',
    borderRadius: 12, padding: '18px 20px',
  }

  const inp = {
    width: '100%', padding: '10px 14px',
    border: '1px solid #E4DDD3', borderRadius: 8,
    fontSize: 13, outline: 'none', backgroundColor: 'white',
    fontFamily: 'Inter, sans-serif', color: '#2B2B2B',
    boxSizing: 'border-box', transition: 'border-color 0.15s',
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F4EF', fontFamily: 'Inter, sans-serif' }}>

      {/* Top bar */}
      <div style={{
        height: 52, padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#1A1A1A', position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/" style={{
            fontWeight: 900, fontSize: 14, color: 'white',
            textDecoration: 'none', letterSpacing: '-0.3px',
          }}>
            BUYLENCE
          </Link>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
            color: '#BE864B', backgroundColor: 'rgba(190,134,75,0.15)',
            padding: '3px 8px', borderRadius: 4,
          }}>
            ADMIN
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
            {user?.fullName}
          </span>
          <button
            onClick={() => { logout(); navigate('/login') }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.7)', padding: '6px 12px',
              borderRadius: 6, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{
        backgroundColor: 'white',
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        padding: '0 24px',
        display: 'flex', gap: 0,
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '14px 18px', background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === tab ? '#BE864B' : 'transparent'}`,
              color: activeTab === tab ? '#BE864B' : '#7F766B',
              fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
              cursor: 'pointer', whiteSpace: 'nowrap',
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.15s', marginBottom: -1,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 64px' }}>

        {/* ── OVERVIEW ── */}
        {activeTab === 'Overview' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 20px', color: '#1D1D1D', letterSpacing: '-0.3px' }}>
              Platform Overview
            </h1>

            {loading ? (
              <p style={{ color: '#9C9488', fontSize: 13 }}>Loading stats...</p>
            ) : (
              <>
                {/* Stats grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
                  gap: 14, marginBottom: 24,
                }}>
                  {[
                    { label: 'TOTAL USERS', value: stats?.totalUsers, icon: '👥', color: '#2563EB' },
                    { label: 'TOTAL VENDORS', value: stats?.totalVendors, icon: '🏪', color: '#D97706' },
                    { label: 'TOTAL RIDERS', value: stats?.totalRiders, icon: '🛵', color: '#7C3AED' },
                    { label: 'TOTAL ORDERS', value: stats?.totalOrders, icon: '📦', color: '#16A34A' },
                    { label: 'ACTIVE ORDERS', value: stats?.activeOrders, icon: '🔄', color: '#C2410C' },
                    { label: 'VERIFIED VENDORS', value: stats?.verifiedVendors, icon: '✓', color: '#16A34A' },
                    { label: 'ACTIVE RIDERS', value: stats?.activeRiders, icon: '🟢', color: '#16A34A' },
                    { label: 'TOTAL REVENUE', value: `₦${(stats?.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: '#BE864B', dark: true },
                  ].map(s => (
                    <div
                      key={s.label}
                      style={{
                        ...cardStyle,
                        backgroundColor: s.dark ? '#BE864B' : 'white',
                        border: s.dark ? 'none' : '1px solid rgba(0,0,0,0.07)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ fontSize: 20 }}>{s.icon}</span>
                      </div>
                      <p style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
                        color: s.dark ? 'rgba(255,255,255,0.7)' : '#9C9488',
                        margin: '0 0 6px',
                      }}>
                        {s.label}
                      </p>
                      <p style={{
                        fontSize: 26, fontWeight: 900, margin: 0,
                        color: s.dark ? 'white' : '#1D1D1D',
                        letterSpacing: '-0.5px',
                      }}>
                        {s.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Recent orders preview */}
                <div style={cardStyle}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Recent Orders</h2>
                    <button
                      onClick={() => setActiveTab('Orders')}
                      style={{
                        background: 'none', border: 'none',
                        fontSize: 11, color: '#BE864B', fontWeight: 700,
                        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      VIEW ALL
                    </button>
                  </div>
                  {orders.slice(0, 5).map((order, i) => {
                    const st = STATUS_BADGE[order.status] || STATUS_BADGE.PLACED
                    return (
                      <div key={order.id} style={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'center', padding: '11px 0',
                        borderBottom: i < 4 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                      }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: '#BE864B' }}>
                            {order.orderNumber}
                          </p>
                          <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>
                            {order.vendor?.storeName} → {order.deliveryHall}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 4px' }}>
                            ₦{order.total?.toLocaleString()}
                          </p>
                          <span style={{
                            fontSize: 9, fontWeight: 800, padding: '2px 7px',
                            borderRadius: 4, backgroundColor: st.bg, color: st.color,
                          }}>
                            {st.label}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── VENDORS ── */}
        {activeTab === 'Vendors' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: '#1D1D1D' }}>
                Vendors ({vendors.length})
              </h1>
            </div>

            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px',
                padding: '10px 20px', backgroundColor: '#F7F4EF',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
              }}>
                {['Store', 'Hall', 'Sales', 'Rating', 'Verified'].map(h => (
                  <p key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#9C9488', margin: 0 }}>
                    {h}
                  </p>
                ))}
              </div>

              {loading ? (
                <p style={{ padding: '24px 20px', fontSize: 13, color: '#9C9488' }}>Loading...</p>
              ) : vendors.length === 0 ? (
                <p style={{ padding: '24px 20px', fontSize: 13, color: '#9C9488' }}>No vendors yet.</p>
              ) : (
                vendors.map((vendor, i) => (
                  <div
                    key={vendor.id}
                    style={{
                      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px',
                      padding: '14px 20px', alignItems: 'center',
                      borderBottom: i < vendors.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: '#1D1D1D' }}>
                        {vendor.storeName}
                      </p>
                      <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>
                        {vendor.user?.email || '—'}
                      </p>
                    </div>
                    <p style={{ fontSize: 12, color: '#7F766B', margin: 0 }}>{vendor.hall}</p>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1D', margin: 0 }}>
                      {vendor.totalSales || 0}
                    </p>
                    <p style={{ fontSize: 12, color: '#BE864B', fontWeight: 700, margin: 0 }}>
                      {vendor.rating ? `★ ${vendor.rating}` : '—'}
                    </p>
                    <button
                      onClick={() => toggleVendorVerified(vendor.id, vendor.verified)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: vendor.verified ? '#16A34A' : '#9C9488',
                        fontWeight: 700, fontSize: 11,
                        fontFamily: 'Inter, sans-serif', padding: 0,
                      }}
                    >
                      {vendor.verified
                        ? <><CheckCircle size={14} /> Verified</>
                        : <><XCircle size={14} /> Unverified</>
                      }
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── RIDERS ── */}
        {activeTab === 'Riders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: '#1D1D1D' }}>
                Riders ({riders.length})
              </h1>
              <button
                onClick={() => setShowRiderForm(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 18px',
                  background: 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
                  color: 'white', border: 'none', borderRadius: 8,
                  fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <Plus size={14} /> Add Rider
              </button>
            </div>

            {/* Add rider form */}
            {showRiderForm && (
              <div style={{ ...cardStyle, marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px', color: '#1D1D1D' }}>
                  Add New Rider
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  {[
                    { key: 'firebaseUid', label: 'FIREBASE UID', placeholder: 'From Firebase Console' },
                    { key: 'fullName', label: 'FULL NAME', placeholder: 'Rider full name' },
                    { key: 'email', label: 'EMAIL', placeholder: 'rider@email.com' },
                    { key: 'phone', label: 'PHONE', placeholder: '08012345678' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#9C9488', display: 'block', marginBottom: 6 }}>
                        {f.label}
                      </label>
                      <input
                        value={riderForm[f.key]}
                        onChange={e => setRiderForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        style={inp}
                        onFocus={e => e.target.style.borderColor = '#BE864B'}
                        onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#9C9488', display: 'block', marginBottom: 6 }}>
                    VEHICLE TYPE
                  </label>
                  <select
                    value={riderForm.vehicleType}
                    onChange={e => setRiderForm(p => ({ ...p, vehicleType: e.target.value }))}
                    style={{ ...inp, cursor: 'pointer' }}
                  >
                    {['Bicycle', 'Motorcycle', 'On Foot'].map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                </div>
                {riderError && (
                  <p style={{ fontSize: 12, color: '#DC2626', backgroundColor: '#FEF2F2', padding: '9px 12px', borderRadius: 6, marginBottom: 12 }}>
                    {riderError}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={addRider} disabled={riderSaving}
                    style={{
                      padding: '10px 20px',
                      background: riderSaving ? '#E4DDD3' : 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
                      color: 'white', border: 'none', borderRadius: 8,
                      fontWeight: 700, fontSize: 12, cursor: riderSaving ? 'not-allowed' : 'pointer',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {riderSaving ? 'Adding...' : 'Add Rider'}
                  </button>
                  <button
                    onClick={() => { setShowRiderForm(false); setRiderError('') }}
                    style={{
                      padding: '10px 20px', backgroundColor: 'white', color: '#7F766B',
                      border: '1px solid #E4DDD3', borderRadius: 8,
                      fontWeight: 600, fontSize: 12, cursor: 'pointer',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px',
                padding: '10px 20px', backgroundColor: '#F7F4EF',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
              }}>
                {['Rider', 'Vehicle', 'Deliveries', 'Status', 'Actions'].map(h => (
                  <p key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#9C9488', margin: 0 }}>
                    {h}
                  </p>
                ))}
              </div>

              {loading ? (
                <p style={{ padding: '24px 20px', fontSize: 13, color: '#9C9488' }}>Loading...</p>
              ) : riders.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <p style={{ fontSize: 32, marginBottom: 12 }}>🛵</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#1D1D1D', marginBottom: 6 }}>No riders yet</p>
                  <p style={{ fontSize: 12, color: '#9C9488' }}>Add your first rider using the button above.</p>
                </div>
              ) : (
                riders.map((rider, i) => (
                  <div
                    key={rider.id}
                    style={{
                      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 100px',
                      padding: '14px 20px', alignItems: 'center',
                      borderBottom: i < riders.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: '#1D1D1D' }}>
                        {rider.user?.fullName || '—'}
                      </p>
                      <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>
                        {rider.user?.phone || rider.user?.email || '—'}
                      </p>
                    </div>
                    <p style={{ fontSize: 12, color: '#7F766B', margin: 0 }}>
                      {rider.vehicleType || '—'}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1D', margin: 0 }}>
                      {rider.totalDeliveries || rider.stats?.totalDeliveries || 0}
                    </p>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6,
                      backgroundColor: rider.isActive ? '#F0FDF4' : '#FEF2F2',
                      color: rider.isActive ? '#16A34A' : '#DC2626',
                      display: 'inline-block',
                    }}>
                      {rider.isActive ? 'Active' : 'Inactive'}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => toggleRiderActive(rider.id, rider.isActive)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: rider.isActive ? '#DC2626' : '#16A34A',
                          display: 'flex', padding: 2,
                        }}
                        title={rider.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {rider.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                      </button>
                      <button
                        onClick={() => deleteRider(rider.id)}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: '#9C9488', display: 'flex', padding: 2, fontSize: 12,
                          fontWeight: 700, fontFamily: 'Inter, sans-serif',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#DC2626'}
                        onMouseLeave={e => e.currentTarget.style.color = '#9C9488'}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── ORDERS ── */}
        {activeTab === 'Orders' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 20px', color: '#1D1D1D' }}>
              All Orders ({orders.length})
            </h1>

            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 80px 110px',
                padding: '10px 20px', backgroundColor: '#F7F4EF',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
              }}>
                {['Order #', 'Route', 'Total', 'Payment', 'Status'].map(h => (
                  <p key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#9C9488', margin: 0 }}>
                    {h}
                  </p>
                ))}
              </div>

              {loading ? (
                <p style={{ padding: '24px 20px', fontSize: 13, color: '#9C9488' }}>Loading...</p>
              ) : orders.length === 0 ? (
                <p style={{ padding: '24px 20px', fontSize: 13, color: '#9C9488' }}>No orders yet.</p>
              ) : (
                orders.slice(0, 50).map((order, i) => {
                  const st = STATUS_BADGE[order.status] || STATUS_BADGE.PLACED
                  const date = new Date(order.createdAt).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'short',
                  })
                  return (
                    <div
                      key={order.id}
                      style={{
                        display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 80px 110px',
                        padding: '13px 20px', alignItems: 'center',
                        borderBottom: i < orders.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                        cursor: 'pointer',
                      }}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFAF8'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 800, color: '#BE864B', margin: '0 0 2px' }}>
                          {order.orderNumber}
                        </p>
                        <p style={{ fontSize: 10, color: '#9C9488', margin: 0 }}>{date}</p>
                      </div>
                      <p style={{ fontSize: 12, color: '#7F766B', margin: 0 }}>
                        {order.vendor?.storeName || '—'} → {order.deliveryHall}
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1D', margin: 0 }}>
                        ₦{order.total?.toLocaleString()}
                      </p>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                        backgroundColor: order.paymentStatus === 'RELEASED' ? '#F0FDF4' : '#F7F4EF',
                        color: order.paymentStatus === 'RELEASED' ? '#16A34A' : '#9C9488',
                      }}>
                        {order.paymentStatus?.replace('_', ' ') || '—'}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                        backgroundColor: st.bg, color: st.color,
                      }}>
                        {st.label}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {activeTab === 'Users' && (
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, margin: '0 0 20px', color: '#1D1D1D' }}>
              All Users ({users.length})
            </h1>

            <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                padding: '10px 20px', backgroundColor: '#F7F4EF',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
              }}>
                {['User', 'Role', 'Hall', 'Joined'].map(h => (
                  <p key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#9C9488', margin: 0 }}>
                    {h}
                  </p>
                ))}
              </div>

              {loading ? (
                <p style={{ padding: '24px 20px', fontSize: 13, color: '#9C9488' }}>Loading...</p>
              ) : users.length === 0 ? (
                <p style={{ padding: '24px 20px', fontSize: 13, color: '#9C9488' }}>No users yet.</p>
              ) : (
                users.map((u, i) => {
                  const role = ROLE_BADGE[u.role] || ROLE_BADGE.BUYER
                  const date = new Date(u.createdAt).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })
                  return (
                    <div
                      key={u.id}
                      style={{
                        display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                        padding: '13px 20px', alignItems: 'center',
                        borderBottom: i < users.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: '#1D1D1D' }}>
                          {u.fullName || '—'}
                        </p>
                        <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>{u.email}</p>
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 6,
                        backgroundColor: role.bg, color: role.color, display: 'inline-block',
                      }}>
                        {role.label}
                      </span>
                      <p style={{ fontSize: 12, color: '#7F766B', margin: 0 }}>{u.hall || '—'}</p>
                      <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>{date}</p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}