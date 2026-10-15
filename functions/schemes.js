// Validation for scheme imports, kept free of Firebase so it can be unit tested.

export const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024

// A healthy report has 21 central schemes, 36 states/UTs and ~60 extras. Anything far
// below these is treated as a broken extraction rather than real data.
export const MIN_COUNTS = { central: 15, states: 30, extras: 20 }

// An import may not shrink a collection by more than this share of what is stored,
// unless the caller passes force: true (e.g. schemes genuinely removed).
export const MAX_SHRINK = 0.25

const FORBIDDEN_KEY = /[.$#[\]/]/

const REQUIRED_FIELDS = {
  central: ['id', 'name'],
  states: ['state', 'code'],
  extras: ['id', 'name'],
}

function badKeys(value, path, found) {
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (!key || FORBIDDEN_KEY.test(key)) found.push(`${path}/${key}`)
      if (found.length < 10) badKeys(child, `${path}/${key}`, found)
    }
  }
  return found
}

const isPlainObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)

// Returns a list of problems; an empty list means the payload can be stored.
// `previousCounts` is the counts object currently stored (or null on the first import).
export function validatePayload(payload, { previousCounts = null, force = false, sizeBytes = 0 } = {}) {
  const errors = []
  if (sizeBytes > MAX_PAYLOAD_BYTES) errors.push(`Payload is ${(sizeBytes / 1024).toFixed(0)} KB; the limit is ${MAX_PAYLOAD_BYTES / 1024} KB.`)
  if (!isPlainObject(payload)) return [...errors, 'Body must be a JSON object.']
  if (!isPlainObject(payload.meta)) errors.push('meta is missing.')
  if (payload.watch !== undefined && !Array.isArray(payload.watch)) errors.push('watch must be an array when present.')

  for (const [collection, fields] of Object.entries(REQUIRED_FIELDS)) {
    const entries = payload[collection]
    if (!isPlainObject(entries)) {
      errors.push(`${collection} must be an object keyed by id.`)
      continue
    }
    const list = Object.values(entries)
    if (list.length < MIN_COUNTS[collection]) {
      errors.push(`${collection} has ${list.length} entries; at least ${MIN_COUNTS[collection]} expected.`)
    }
    const incomplete = list.filter((entry) => !isPlainObject(entry) || fields.some((field) => !entry[field]))
    if (incomplete.length) errors.push(`${collection}: ${incomplete.length} entries are missing ${fields.join(' or ')}.`)

    const previous = previousCounts?.[collection]
    if (!force && previous && list.length < previous * (1 - MAX_SHRINK)) {
      errors.push(`${collection} would shrink from ${previous} to ${list.length}. Send force: true if that is intended.`)
    }
  }

  const keys = badKeys(payload, '', [])
  if (keys.length) errors.push(`Keys Firebase cannot store: ${keys.slice(0, 5).join(', ')}`)
  return errors
}

export function countsOf(payload) {
  return {
    central: Object.keys(payload.central).length,
    states: Object.keys(payload.states).length,
    extras: Object.keys(payload.extras).length,
    watch: Array.isArray(payload.watch) ? payload.watch.length : 0,
  }
}

// History is filed under the India-time month of the import, e.g. "2026-11"
export function historyMonth(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit' }).formatToParts(date)
  const get = (type) => parts.find((part) => part.type === type).value
  return `${get('year')}-${get('month')}`
}
