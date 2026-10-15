import { initializeApp } from 'firebase/app'
import { connectDatabaseEmulator, getDatabase } from 'firebase/database'

// Web config comes from .env.local (see .env.example). These values identify the
// project but grant no access on their own; database.rules.json controls access.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(config.apiKey && config.databaseURL && config.projectId)

export const app = isFirebaseConfigured ? initializeApp(config) : null

export const db = app ? getDatabase(app) : null

// Local testing: set VITE_FIREBASE_EMULATORS=true and run `firebase emulators:start --only auth,database`
export const useEmulators = import.meta.env.VITE_FIREBASE_EMULATORS === 'true'
if (db && useEmulators) connectDatabaseEmulator(db, '127.0.0.1', 9000)
