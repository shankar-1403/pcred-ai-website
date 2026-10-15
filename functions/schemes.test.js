import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { MAX_PAYLOAD_BYTES, countsOf, historyMonth, validatePayload } from './schemes.js'

const many = (count, make) => Object.fromEntries(Array.from({ length: count }, (_, i) => [`k${i}`, make(i)]))

function samplePayload() {
  return {
    meta: { statesChecked: '1 Oct 2026', extrasChecked: '1 Oct 2026', centralVerified: '28 Sep 2026' },
    central: many(21, (i) => ({ id: `c${i}`, name: `Central ${i}` })),
    states: many(36, (i) => ({ state: `State ${i}`, code: `S${i}`, items: [{ name: 'Capital subsidy' }] })),
    extras: many(63, (i) => ({ id: `e${i}`, name: `Extra ${i}` })),
    watch: [{ name: 'Announced scheme' }],
  }
}

test('accepts a complete payload', () => {
  assert.deepEqual(validatePayload(samplePayload()), [])
})

test('rejects a truncated extraction', () => {
  const payload = samplePayload()
  payload.states = many(5, (i) => ({ state: `State ${i}`, code: `S${i}` }))
  assert.match(validatePayload(payload).join(' '), /states has 5 entries/)
})

test('rejects entries missing required fields', () => {
  const payload = samplePayload()
  payload.extras.k3 = { id: 'e3' }
  assert.match(validatePayload(payload).join(' '), /extras: 1 entries are missing id or name/)
})

test('rejects keys Firebase cannot store', () => {
  const payload = samplePayload()
  payload.states.k0.items[0]['bad.key'] = 1
  assert.match(validatePayload(payload).join(' '), /Keys Firebase cannot store/)
})

test('refuses a large shrink unless forced', () => {
  const payload = samplePayload()
  const previousCounts = { central: 21, states: 36, extras: 100 }
  assert.match(validatePayload(payload, { previousCounts }).join(' '), /extras would shrink from 100 to 63/)
  assert.deepEqual(validatePayload(payload, { previousCounts, force: true }), [])
})

test('rejects oversize bodies and non-objects', () => {
  assert.match(validatePayload(samplePayload(), { sizeBytes: MAX_PAYLOAD_BYTES + 1 }).join(' '), /limit is/)
  assert.deepEqual(validatePayload([]), ['Body must be a JSON object.'])
})

test('counts collections and files history by India-time month', () => {
  assert.deepEqual(countsOf(samplePayload()), { central: 21, states: 36, extras: 63, watch: 1 })
  // 31 Oct 2026 20:00 UTC is already 1 Nov in India
  assert.equal(historyMonth(new Date('2026-10-31T20:00:00Z')), '2026-11')
  assert.equal(historyMonth(new Date('2026-11-01T03:22:00Z')), '2026-11')
})

// Real payload check: SCHEMES_PAYLOAD=path/to/payload.json npm test
test('accepts the real payload from the Scheme Report', { skip: !process.env.SCHEMES_PAYLOAD }, () => {
  const raw = readFileSync(process.env.SCHEMES_PAYLOAD, 'utf8')
  assert.deepEqual(validatePayload(JSON.parse(raw), { sizeBytes: Buffer.byteLength(raw) }), [])
})
