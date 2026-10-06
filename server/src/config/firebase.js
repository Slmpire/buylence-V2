const admin = require('firebase-admin')

if (!admin.apps.length) {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Private key comes from .env with literal \n — must convert back to real newlines
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    })
  } else {
    console.warn('⚠️ Firebase Admin SDK initialized without credentials. Auth token verification will fail until FIREBASE_* env vars are set.')
    admin.initializeApp()
  }
}

module.exports = admin