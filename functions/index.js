import { createHash, timingSafeEqual } from 'node:crypto'
import { initializeApp } from 'firebase-admin/app'
import { ServerValue, getDatabase } from 'firebase-admin/database'
import * as logger from 'firebase-functions/logger'
import { defineSecret } from 'firebase-functions/params'
import { onRequest } from 'firebase-functions/v2/https'
import { countsOf, historyMonth, validatePayload } from './schemes.js'

initializeApp()

// Shared with the monthly "scheme rule check" routine, which sends it in the
// x-import-key header. Set with: firebase functions:secrets:set SCHEMES_IMPORT_KEY
const importKey = defineSecret('SCHEMES_IMPORT_KEY')

// Compares hashes so the check takes the same time whatever the input
function keyMatches(given, expected) {
  if (!given || !expected) return false
  const digest = (value) => createHash('sha256').update(String(value)).digest()
  return timingSafeEqual(digest(given), digest(expected))
}

// POST /importSchemes — called by the routine after it republishes the Scheme Report.
// Body: the payload from scripts/schemes/build-payload.mjs, optionally with force: true.
// Replaces schemes/current and files a copy under schemes/history/<YYYY-MM> (indexed in
// schemes/months), all in one write.
export const importSchemes = onRequest(
  {
    region: 'asia-south1',
    secrets: [importKey],
    maxInstances: 1,
    timeoutSeconds: 60,
    memory: '256MiB',
    invoker: 'public',
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.set('Allow', 'POST').status(405).json({ ok: false, error: 'Use POST.' })
      return
    }
    if (!keyMatches(req.get('x-import-key'), importKey.value())) {
      logger.warn('importSchemes: rejected request with a missing or wrong key')
      res.status(401).json({ ok: false, error: 'Missing or wrong x-import-key.' })
      return
    }

    const { force = false, ...payload } = req.body ?? {}
    const db = getDatabase()
    const previousCounts = (await db.ref('schemes/current/meta/counts').get()).val()
    const errors = validatePayload(payload, { previousCounts, force: force === true, sizeBytes: req.rawBody?.length ?? 0 })
    if (errors.length) {
      logger.warn('importSchemes: payload rejected', { errors })
      res.status(422).json({ ok: false, errors })
      return
    }

    const month = historyMonth()
    const counts = countsOf(payload)
    const record = {
      ...payload,
      watch: payload.watch ?? [],
      meta: { ...payload.meta, counts, month, importedAt: ServerValue.TIMESTAMP },
    }
    // Multi-path update: readers never see current without the matching history entry.
    // months/ is a small index so the CMS can list past imports without downloading them.
    await db.ref('schemes').update({
      current: record,
      [`history/${month}`]: record,
      [`months/${month}`]: { counts, importedAt: ServerValue.TIMESTAMP, statesChecked: payload.meta.statesChecked ?? '' },
    })

    logger.info('importSchemes: stored', { month, counts, previousCounts })
    res.json({ ok: true, month, counts, previousCounts })
  },
)

// Udyam verification, certificate intake, OTP, payment and the 90-day lead cache, moved here from
// the separate pcred-udyam-system project. Hosting rewrites /api/udyam/* to udyamVerify (firebase.json).
export { udyamVerify, deactivateLeads } from './udyam/index.js'
