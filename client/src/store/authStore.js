import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import api from '../lib/axios'
import { signInWithPopup } from 'firebase/auth'
import { googleProvider } from '../lib/firebase'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      loading: true,

      // ── Called once on app boot from main.jsx or App.jsx ──
      // Listens to Firebase auth state and syncs with backend
      initAuth: () => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const res = await api.get('/auth/me')
              set({
                user: res.data.user,
                isLoggedIn: true,
                loading: false,
              })
            } catch (err) {
              console.error('Failed to sync user:', err)
              set({ user: null, isLoggedIn: false, loading: false })
            }
          } else {
            set({ user: null, isLoggedIn: false, loading: false })
          }
        })
        return unsubscribe
      },
          // ── Login with Google ──
      loginWithGoogle: async () => {

        const cred = await signInWithPopup(auth, googleProvider)

        // Sync to backend — creates User row if first time

        const res = await api.post('/auth/sync', {

          fullName: cred.user.displayName || cred.user.email.split('@')[0],

          role: 'BUYER',

        })

        set({ user: res.data.user, isLoggedIn: true })

        return res.data.user

      },

      // ── Login ──
      login: async (credentialsOrUserData) => {
        // Support two call signatures:
        // 1. Real login: login({ email, password })
        // 2. Legacy mock login: login({ fullName, role, ... }) — still works during transition
        if (credentialsOrUserData.password !== undefined) {
          // Real Firebase login
          const { email, password } = credentialsOrUserData
          await signInWithEmailAndPassword(auth, email, password)
          const res = await api.get('/auth/me')
          set({ user: res.data.user, isLoggedIn: true })
          return res.data.user
        } else {
          // Legacy path — called from onboarding/profile pages with partial data
          // Merges new fields into existing user without hitting Firebase
          set(state => ({
            user: { ...state.user, ...credentialsOrUserData },
            isLoggedIn: true,
          }))
        }
      },

      // ── Signup ──
      signup: async ({ fullName, email, password, role = 'BUYER' }) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await firebaseUpdateProfile(cred.user, { displayName: fullName })

        // Sync to backend — creates User row in DB
        const res = await api.post('/auth/sync', { fullName })
        set({ user: res.data.user, isLoggedIn: true })
        return res.data.user
      },

      // ── Logout ──
      logout: async () => {
        await signOut(auth)
        set({ user: null, isLoggedIn: false })
      },

      // ── Update profile ──
      updateProfile: async (data) => {
        const res = await api.patch('/auth/profile', data)
        set(state => ({
          user: { ...state.user, ...res.data.user },
        }))
        return res.data.user
      },

      // ── Vendor onboarding ──
      onboardVendor: async ({ storeName, hall, storeType, categories, description }) => {
        const res = await api.post('/vendors/onboard', {
          storeName, hall, storeType, categories, description,
        })
        // After onboarding, re-fetch full user profile to get updated role
        const userRes = await api.get('/auth/me')
        set({ user: userRes.data.user })
        return res.data.vendor
      },
    }),
    {
      name: 'buylence-auth',
      // Only persist non-sensitive fields — Firebase manages the real session
      partialize: (state) => ({
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
)

export default useAuthStore