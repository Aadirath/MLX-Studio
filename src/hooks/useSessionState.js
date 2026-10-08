import { useEffect, useState } from 'react'

// Default check for a restored value: it must have the same basic type as the
// initial value, so a stale or hand-edited entry cannot break a page.
function sameKind(value, initial) {
  if (typeof initial === 'number') return Number.isFinite(value)
  if (typeof initial === 'string') return typeof value === 'string'
  if (typeof initial === 'boolean') return typeof value === 'boolean'
  return true
}

function readStored(key, initial, isValid) {
  try {
    const raw = sessionStorage.getItem(key)
    if (raw !== null) {
      const value = JSON.parse(raw)
      if (isValid ? isValid(value) : sameKind(value, initial)) return value
    }
  } catch {
    // storage unavailable or entry unreadable: fall back to the initial value
  }
  return typeof initial === 'function' ? initial() : initial
}

// Works like useState, but keeps the value in sessionStorage (as JSON) so it
// survives leaving the page and coming back in the same browser session.
export function useSessionState(key, initial, isValid) {
  const [value, setValue] = useState(() => readStored(key, initial, isValid))

  useEffect(() => {
    try {
      const json = JSON.stringify(value)
      if (json !== undefined) sessionStorage.setItem(key, json)
    } catch {
      // storage full or blocked: the page keeps working without saving
    }
  }, [key, value])

  return [value, setValue]
}

// Forgets everything saved under a prefix such as 'mlx.k-means.'.
export function clearSessionState(prefix) {
  try {
    const keys = []
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i)
      if (key && key.startsWith(prefix)) keys.push(key)
    }
    keys.forEach((key) => sessionStorage.removeItem(key))
  } catch {
    // ignore storage errors
  }
}
