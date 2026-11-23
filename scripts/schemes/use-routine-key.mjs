// One-time fix so the monthly routine's imports are accepted: sets SCHEMES_IMPORT_KEY to the key
// written in the routine's instructions, then redeploys importSchemes. The key is never printed.
//
//   node scripts/schemes/use-routine-key.mjs <saved routine JSON>
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/schemes/use-routine-key.mjs <saved routine JSON>')
  process.exit(1)
}
const text = readFileSync(file, 'utf8')
const trigger = JSON.parse(text.slice(text.indexOf('{'))).trigger
const keys = [...new Set([...trigger.derived_state.prompt.matchAll(/'x-import-key':'([^']+)'/g)].map((m) => m[1]))]
if (keys.length !== 1) {
  console.error(`Expected one import key in the routine, found ${keys.length}.`)
  process.exit(1)
}

const dir = mkdtempSync(join(tmpdir(), 'pcred-key-'))
const keyFile = join(dir, 'key.txt')
try {
  writeFileSync(keyFile, keys[0])
  const firebase = process.platform === 'win32' ? 'firebase.cmd' : 'firebase'
  execFileSync(firebase, ['functions:secrets:set', 'SCHEMES_IMPORT_KEY', '--data-file', keyFile], { stdio: 'inherit', shell: process.platform === 'win32' })
  execFileSync(firebase, ['deploy', '--only', 'functions:importSchemes'], { stdio: 'inherit', shell: process.platform === 'win32' })
  console.log('Done: the routine key is now the import key, and importSchemes is redeployed.')
} finally {
  rmSync(dir, { recursive: true, force: true })
}
