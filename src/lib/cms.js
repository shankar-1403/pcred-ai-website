import { ref, update } from 'firebase/database'
import { db } from './firebase'

// Rewrites order fields as 1..n in the given sequence, in one atomic update
export function saveOrder(basePath, ids) {
  return update(ref(db, basePath), Object.fromEntries(ids.map((id, index) => [`${id}/order`, index + 1])))
}

export function swap(list, index, offset) {
  const next = [...list]
  ;[next[index], next[index + offset]] = [next[index + offset], next[index]]
  return next
}
