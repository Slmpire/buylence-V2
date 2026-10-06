import axios from 'axios'
import { auth, authReady } from './firebase'
import useLoadingStore from '../store/loadingStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // don't spin forever if the server is asleep or unreachable
})

// Attach Firebase ID token to every request automatically.
// Pass { silent: true } in a request's config to skip the global loader (e.g. polling).
api.interceptors.request.use(async (config) => {
  if (!config.silent) {
    config._tracked = true
    useLoadingStore.getState().start()
  }
  await authReady // wait for Firebase to finish restoring the session before checking currentUser
  const user = auth.currentUser
  if (user) {
    const token = await user.getIdToken()
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Global response error handling
api.interceptors.response.use(
  res => {
    if (res.config?._tracked) useLoadingStore.getState().stop()
    return res
  },
  err => {
    if (err.config?._tracked) useLoadingStore.getState().stop()
    if (err.response?.status === 401) {
      auth.signOut()
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api