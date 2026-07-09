import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth'


const firebaseConfig = {
  apiKey: "AIzaSyAKA8xC05LieY7oY1YbRYhH__8kCGYCP8Y",
  authDomain: "shopbuylence.firebaseapp.com",
  projectId: "shopbuylence",
  storageBucket: "shopbuylence.firebasestorage.app",
  messagingSenderId: "941505314043",
  appId: "1:941505314043:web:407363e7ceb0025e4bc45e",
  measurementId: "G-ZBELE0S5Q3"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Resolves once Firebase has restored (or confirmed there's no) session on page load
let authReadyResolve
export const authReady = new Promise((resolve) => {
  authReadyResolve = resolve
})
onAuthStateChanged(auth, () => {
  authReadyResolve()
})

export default app