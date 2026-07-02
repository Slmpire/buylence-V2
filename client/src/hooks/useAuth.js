import { useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import api from '../lib/axios'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [dbUser, setDbUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        try {
          // Sync with our backend and get the full user profile
          const res = await api.get('/auth/me')
          setDbUser(res.data.user)
        } catch (err) {
          console.error('Failed to fetch user profile:', err)
        }
      } else {
        setUser(null)
        setDbUser(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  async function signup({ fullName, email, password, role = 'BUYER' }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)

    // Set display name in Firebase
    await updateProfile(cred.user, { displayName: fullName })

    // Sync to our backend — creates the User row
    const res = await api.post('/auth/sync', { fullName, role })
    setDbUser(res.data.user)

    return res.data.user
  }

  async function login({ email, password }) {
    const cred = await signInWithEmailAndPassword(auth, email, password)

    // Fetch full profile from our backend
    const res = await api.get('/auth/me')
    setDbUser(res.data.user)

    return res.data.user
  }

  async function logout() {
    await signOut(auth)
    setUser(null)
    setDbUser(null)
  }

  async function updateProfile_({ fullName, phone, hall, room, matric, bio }) {
    const res = await api.patch('/auth/profile', {
      fullName, phone, hall, room, matric, bio,
    })
    setDbUser(res.data.user)
    return res.data.user
  }

  return {
    // Firebase user (has uid, email, displayName, getIdToken etc)
    firebaseUser: user,

    // Our DB user (has role, vendor info, hall, matric etc)
    user: dbUser,

    // Convenience flags
    isLoggedIn: !!user,
    isVendor: dbUser?.role === 'VENDOR',
    isRider: dbUser?.role === 'RIDER',
    isAdmin: dbUser?.role === 'ADMIN',

    loading,
    signup,
    login,
    logout,
    updateProfile: updateProfile_,
  }
}