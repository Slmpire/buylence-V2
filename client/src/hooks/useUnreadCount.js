import { useState, useEffect, useCallback } from 'react'
import api from '../lib/axios'
import useAuthStore from '../store/authStore'

export default function useUnreadCount() {
  const isLoggedIn = useAuthStore(s => s.isLoggedIn)
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const res = await api.get('/notifications', { silent: true })
      setUnreadCount(res.data.unreadCount || 0)
    } catch {
      // ignore: the badge simply stays as it was
    }
  }, [])

  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0)
      return
    }
    refresh()
    const timer = setInterval(refresh, 60000)
    return () => clearInterval(timer)
  }, [isLoggedIn, refresh])

  return { unreadCount, setUnreadCount, refresh }
}