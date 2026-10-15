// Builds the scheme import payload from the Udyam Scheme Report artifact HTML.
//
//   node scripts/schemes/build-payload.mjs <artifact.html> [--out payload.json]
//
// The artifact keeps its data in two JSON blocks (`data-states`, `data-extras`) and
// two JavaScript arrays in its main script (`SCHEMES`, `WATCH`) plus `VERIFIED`.
// This turns them into the shape stored under schemes/current in the Realtime Database.
// The monthly routine runs the same extraction before POSTing to the importSchemes function.
import { readFileSync, writeFileSync } from 'node:fs'
import vm from 'node:vm'

const ARTIFACT_URL = 'https://claude.ai/artifact/HDXhXEeU3ARSkPzkNsDRMB'
const BACKSLASH = String.fromCharCode(92)

function jsonBlock(html, id) {
  const marker = html.indexOf(`id="${id}"`)
  if (marker < 0) throw new Error(`JSON block "${id}" not found`)
  const start = html.indexOf('>', marker) + 1
  const end = html.indexOf('</script>', start)
  return JSON.parse(html.slice(start, end))
}

// Source text of the array literal assigned by `const NAME = [`, matched bracket by bracket
function arraySource(html, name) {
  const at = html.indexOf(`const ${name} = [`)
  if (at < 0) return null
  const start = html.indexOf('[', at)
  let depth = 0
  let quote = null
  for (let i = start; i < html.length; i++) {
    const c = html[i]
    if (quote) {
      if (c === BACKSLASH) i++
      else if (c === quote) quote = null
      continue
    }
    if (c === '"' || c === "'" || c === '`') quote = c
    else if (c === '[' || c === '{') depth++
    else if (c === ']' || c === '}') {
      depth--
      if (depth === 0) return html.slice(start, i + 1)
    }
  }
  throw new Error(`Unterminated array for ${name}`)
}

// Evaluates a plain array literal in an empty sandbox (no globals, short timeout)
function evaluateArray(source) {
  return vm.runInNewContext(`(${source})`, Object.create(null), { timeout: 2000 })
}

// Firebase keys cannot contain . $ # [ ] / or be empty
const FORBIDDEN_KEY = /[.$#[\]/]/
export const toKey = (value) => String(value).trim().replace(/[.$#[\]/\s]+/g, '-').replace(/^-+|-+$/g, '')

function keyed(list, keyOf, label) {
  const result = {}
  for (const entry of list) {
    const key = toKey(keyOf(entry))
    if (!key) throw new Error(`${label}: an entry has no id`)
    if (result[key]) throw new Error(`${label}: duplicate id "${key}"`)
    result[key] = entry
  }
  return result
}

export function badKeys(value, path = '', found = []) {
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (!key || FORBIDDEN_KEY.test(key)) found.push(`${path}/${key}`)
      badKeys(child, `${path}/${key}`, found)
    }
  }
  return found
}

export function buildPayload(html) {
  const states = jsonBlock(html, 'data-states')
  const extras = jsonBlock(html, 'data-extras')
  const schemesSource = arraySource(html, 'SCHEMES')
  if (!schemesSource) throw new Error('SCHEMES array not found')
  const central = evaluateArray(schemesSource)
  const watchSource = arraySource(html, 'WATCH')
  const watch = watchSource ? evaluateArray(watchSource) : []
  const verified = (html.match(/const VERIFIED = '([^']*)'/) || [])[1] || ''

  const payload = {
    meta: {
      source: ARTIFACT_URL,
      statesChecked: states.checked || '',
      extrasChecked: extras.checked || '',
      centralVerified: verified,
      counts: { central: central.length, states: states.states.length, extras: extras.items.length, watch: watch.length },
    },
    central: keyed(central, (scheme) => scheme.id, 'central'),
    states: keyed(states.states, (state) => state.code, 'states'),
    extras: keyed(extras.items, (item) => item.id, 'extras'),
    watch,
  }

  const problems = badKeys(payload)
  if (problems.length) throw new Error(`Keys Firebase cannot store: ${problems.slice(0, 5).join(', ')}`)
  return payload
}

// CLI
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const [file, ...rest] = process.argv.slice(2)
  if (!file) {
    console.error('Usage: node scripts/schemes/build-payload.mjs <artifact.html> [--out payload.json]')
    process.exit(1)
  }
  const payload = buildPayload(readFileSync(file, 'utf8'))
  const outAt = rest.indexOf('--out')
  const json = JSON.stringify(payload)
  if (outAt >= 0 && rest[outAt + 1]) {
    writeFileSync(rest[outAt + 1], json)
    console.error(`Wrote ${rest[outAt + 1]} (${(json.length / 1024).toFixed(0)} KB)`)
  } else {
    process.stdout.write(json)
  }
  console.error(JSON.stringify(payload.meta))
}
