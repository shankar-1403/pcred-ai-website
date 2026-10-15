import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { starterSuits } from '../lib/suits'
import { SuitsContext, normalizeSuits, starterToDatabase } from '../lib/suitsStore'

const starter = normalizeSuits(starterToDatabase(starterSuits))

function SuitsProvider({ children }) {
  const [state, setState] = useState(() =>
    isFirebaseConfigured
      ? { suits: [], loading: true, error: null, source: 'firebase' }
      : { suits: starter, loading: false, error: null, source: 'starter' },
  )

  useEffect(() => {
    if (!db) return undefined
    // Live subscription: CMS edits show up on open pages without a reload
    return onValue(
      ref(db, 'suits'),
      (snapshot) => setState({ suits: normalizeSuits(snapshot.val()), loading: false, error: null, source: 'firebase' }),
      (error) => setState({ suits: starter, loading: false, error, source: 'starter' }),
    )
  }, [])

  return <SuitsContext.Provider value={state}>{children}</SuitsContext.Provider>
}

export default SuitsProvider
