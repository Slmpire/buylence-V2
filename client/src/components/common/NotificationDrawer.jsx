import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, CheckCheck, Trash2, Bell, Package, Info, Tag, ExternalLink } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { auth } from '../../lib/firebase'

export default function NotificationDrawer({ isOpen, onClose, onNotificationChange }) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'unread'
  const { isLoggedIn } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isOpen && isLoggedIn) {
      fetchNotifications()
    }
  }, [isOpen, isLoggedIn])

  async function fetchNotifications() {
    setLoading(true)
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        if (onNotificationChange) onNotificationChange(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }

  async function markAsRead(id) {
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const url = id === 'all' ? '/api/notifications/read-all' : `/api/notifications/${id}/read`
      const res = await fetch(url, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        if (id === 'all') {
          setNotifications(prev => prev.map(n => ({ ...n, read: true })))
          if (onNotificationChange) onNotificationChange(0)
        } else {
          setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
          )
          const newUnread = notifications.filter(n => !n.read && n.id !== id).length
          if (onNotificationChange) onNotificationChange(newUnread)
        }
      }
    } catch (err) {
      console.error('Error marking notification read:', err)
    }
  }

  async function deleteNotification(id, e) {
    e.stopPropagation()
    try {
      const token = await auth.currentUser?.getIdToken()
      if (!token) return

      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
        const remaining = notifications.filter(n => n.id !== id)
        const unreadCount = remaining.filter(n => !n.read).length
        if (onNotificationChange) onNotificationChange(unreadCount)
      }
    } catch (err) {
      console.error('Error deleting notification:', err)
    }
  }

  function handleNotificationClick(item) {
    if (!item.read) {
      markAsRead(item.id)
    }
    if (item.link) {
      onClose()
      navigate(item.link)
    }
  }

  function formatTime(dateStr) {
    const date = new Date(dateStr)
    const now = new Date()
    const diffSec = Math.floor((now - date) / 1000)

    if (diffSec < 60) return 'Just now'
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`
    return date.toLocaleDateString()
  }

  function getIcon(type) {
    switch (type) {
      case 'ORDER':
        return <Package size={18} color="#BE6B1A" />
      case 'PROMO':
        return <Tag size={18} color="#16A34A" />
      default:
        return <Info size={18} color="#2563EB" />
    }
  }

  if (!isOpen) return null

  const filtered = filter === 'unread' ? notifications.filter(n => !n.read) : notifications
  const unreadTotal = notifications.filter(n => !n.read).length

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(2px)',
          zIndex: 998,
          transition: 'opacity 0.2s',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed',
          top: 0, right: 0, bottom: 0,
          width: '100%', maxWidth: 400,
          backgroundColor: '#FFFFFF',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.15)',
          zIndex: 999,
          display: 'flex', flexDirection: 'column',
          fontFamily: 'Inter, sans-serif',
          animation: 'slideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <style>{`
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Drawer Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid #F0EDE8',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: '#FCFAF7',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bell size={20} color="#BE6B1A" />
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: '#1A1A1A' }}>
              Notifications
            </h2>
            {unreadTotal > 0 && (
              <span style={{
                backgroundColor: '#BE6B1A', color: 'white',
                fontSize: 11, fontWeight: 700,
                padding: '2px 8px', borderRadius: 12,
              }}>
                {unreadTotal} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#888', padding: 4, display: 'flex', borderRadius: '50%',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter & Actions Bar */}
        <div style={{
          padding: '12px 20px',
          borderBottom: '1px solid #F0EDE8',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { key: 'all', label: `All (${notifications.length})` },
              { key: 'unread', label: `Unread (${unreadTotal})` },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                style={{
                  background: filter === tab.key ? '#F7F4EF' : 'none',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 12, fontWeight: 700,
                  color: filter === tab.key ? '#BE6B1A' : '#777',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mark All Read Button */}
          {unreadTotal > 0 && (
            <button
              onClick={() => markAsRead('all')}
              style={{
                background: 'none', border: 'none',
                color: '#BE6B1A', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                padding: 0, fontFamily: 'Inter, sans-serif',
              }}
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* Notification List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#888', fontSize: 13 }}>
              Loading notifications...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                backgroundColor: '#F7F4EF', color: '#9C9488',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 12px',
              }}>
                <Bell size={22} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 4px', color: '#1A1A1A' }}>
                No notifications
              </p>
              <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
                {filter === 'unread'
                  ? 'You have read all your notifications!'
                  : 'You will receive notifications here about your orders and updates.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {filtered.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  style={{
                    padding: '14px',
                    borderRadius: 10,
                    backgroundColor: item.read ? '#FFFFFF' : '#FFFBF6',
                    border: item.read ? '1px solid #F0EDE8' : '1px solid #F7E5D0',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s',
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
                >
                  {/* Icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    backgroundColor: item.read ? '#F7F4EF' : '#FDECDA',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, marginTop: 2,
                  }}>
                    {getIcon(item.type)}
                  </div>

                  {/* Body */}
                  <div style={{ flex: 1, paddingRight: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <h4 style={{
                        fontSize: 13, fontWeight: item.read ? 600 : 800,
                        margin: 0, color: '#1A1A1A', flex: 1,
                      }}>
                        {item.title}
                      </h4>
                      {!item.read && (
                        <span style={{
                          width: 7, height: 7, borderRadius: '50%',
                          backgroundColor: '#BE6B1A', flexShrink: 0,
                        }} />
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: '#555', margin: '0 0 6px', lineHeight: 1.4 }}>
                      {item.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 11, color: '#9C9488' }}>
                        {formatTime(item.createdAt)}
                      </span>
                      {item.link && (
                        <span style={{
                          fontSize: 11, color: '#BE6B1A', fontWeight: 600,
                          display: 'flex', alignItems: 'center', gap: 2,
                        }}>
                          View <ExternalLink size={10} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={e => deleteNotification(item.id, e)}
                    title="Delete"
                    style={{
                      position: 'absolute', top: 12, right: 12,
                      background: 'none', border: 'none',
                      color: '#CCC', cursor: 'pointer', padding: 2,
                      display: 'flex', transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#E74C3C'}
                    onMouseLeave={e => e.currentTarget.style.color = '#CCC'}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
