import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { app, useEmulators } from './firebase'

// Kept apart from firebase.js so only the lazily loaded CMS pulls in Firebase Auth
export const auth = app ? getAuth(app) : null
if (auth && useEmulators) connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
