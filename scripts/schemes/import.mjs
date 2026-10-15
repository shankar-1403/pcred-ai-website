// Builds the payload from a Scheme Report HTML file and sends it to the importSchemes function.
//
//   SCHEMES_IMPORT_KEY=... node scripts/schemes/import.mjs <artifact.html> [--force] [--dry-run]
//
// --dry-run  builds and checks the payload without sending it
// --force    allows a collection to shrink by more than 25% (see functions/schemes.js)
// SCHEMES_IMPORT_URL overrides the endpoint (defaults to the deployed function).
import { readFileSync } from 'node:fs'
import { buildPayload } from './build-payload.mjs'

const DEFAULT_URL = 'https://asia-south1-pcred-ai-website.cloudfunctions.net/importSchemes'

const args = process.argv.slice(2)
const file = args.find((arg) => !arg.startsWith('--'))
if (!file) {
  console.error('Usage: SCHEMES_IMPORT_KEY=... node scripts/schemes/import.mjs <artifact.html> [--force] [--dry-run]')
  process.exit(1)
}

const payload = buildPayload(readFileSync(file, 'utf8'))
const body = JSON.stringify({ ...payload, force: args.includes('--force') })
console.log(`Built payload: ${JSON.stringify(payload.meta.counts)} (${(body.length / 1024).toFixed(0)} KB)`)

if (args.includes('--dry-run')) {
  console.log('Dry run: nothing sent.')
  process.exit(0)
}

const key = process.env.SCHEMES_IMPORT_KEY
if (!key) {
  console.error('Set SCHEMES_IMPORT_KEY to the value stored with `firebase functions:secrets:set SCHEMES_IMPORT_KEY`.')
  process.exit(1)
}

const response = await fetch(process.env.SCHEMES_IMPORT_URL || DEFAULT_URL, {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'x-import-key': key },
  body,
})
const result = await response.json().catch(() => ({ ok: false, error: `HTTP ${response.status}` }))
console.log(JSON.stringify(result, null, 2))
process.exit(result.ok ? 0 : 1)
