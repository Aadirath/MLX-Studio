import { useCallback, useEffect, useState } from 'react'

const MAX_ENTRIES = 20

function isEntryList(v) {
  return (
    Array.isArray(v) &&
    v.length <= MAX_ENTRIES &&
    v.every((e) => e && Number.isInteger(e.n) && typeof e.text === 'string')
  )
}

function readEntries(key) {
  try {
    const raw = sessionStorage.getItem(key)
    if (raw !== null) {
      const value = JSON.parse(raw)
      if (isEntryList(value)) return value
    }
  } catch {
    // storage unavailable or entry unreadable: start with an empty log
  }
  return []
}

// Keeps a short list of the learner's experiments (oldest first) for one topic.
export function useExperimentLog(topicKey) {
  const key = `mlx.log.${topicKey}`
  const [entries, setEntries] = useState(() => readEntries(key))

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(entries))
    } catch {
      // storage full or blocked: the log still works for this visit
    }
  }, [key, entries])

  const addEntry = useCallback((text) => {
    setEntries((list) => {
      const n = list.length ? list[list.length - 1].n + 1 : 1
      return [...list, { n, text: String(text) }].slice(-MAX_ENTRIES)
    })
  }, [])

  const clear = useCallback(() => setEntries([]), [])

  return { entries, addEntry, clear }
}
