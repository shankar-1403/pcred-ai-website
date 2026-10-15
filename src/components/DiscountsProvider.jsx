import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db } from '../lib/firebase'
import { DiscountsContext, normalizeDiscounts } from '../lib/discounts'

function DiscountsProvider({ children }) {
  const [state, setState] = useState(() => ({ tiers: [], loading: Boolean(db) }))

  useEffect(() => {
    if (!db) return undefined
    // Live: tier changes in the CMS reach open carts without a reload. Read failures mean no discounts.
    return onValue(
      ref(db, 'discounts'),
      (snapshot) => setState({ tiers: normalizeDiscounts(snapshot.val()), loading: false }),
      () => setState({ tiers: [], loading: false }),
    )
  }, [])

  return <DiscountsContext.Provider value={state}>{children}</DiscountsContext.Provider>
}

export default DiscountsProvider
