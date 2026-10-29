// Sends usage events to /api/log. Nothing here ever blocks or breaks the app.
// A name or roll number is attached only if the learner chose to enter one. No emails or IP addresses are collected. Browsers that send "Do Not Track" are respected.

const SID_KEY = 'mlx.sid'

function sessionId() {
  try {
    let id = sessionStorage.getItem(SID_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      sessionStorage.setItem(SID_KEY, id)
    }
    return id
  } catch {
    return 'no-storage-session'
  }
}

function loggingAllowed() {
  if (import.meta.env.DEV) return false // the local dev server has no /api
  if (typeof navigator !== 'undefined' && (navigator.doNotTrack === '1' || window.doNotTrack === '1')) return false
  return true
}

const LEARNER_KEY = 'mlx.learner'
const SKIP_KEY = 'mlx.learner.skip'
let memoryLearner = ''

// The name or roll number a learner chose to enter. Empty means anonymous.
export function getLearner() {
  try {
    return localStorage.getItem(LEARNER_KEY) || memoryLearner
  } catch {
    return memoryLearner
  }
}

export function setLearner(value) {
  memoryLearner = String(value || '').trim().slice(0, 60)
  try {
    if (memoryLearner) localStorage.setItem(LEARNER_KEY, memoryLearner)
    else localStorage.removeItem(LEARNER_KEY)
  } catch {
    // storage blocked: the name lasts for this visit only
  }
}

// True when logging is on and the learner has neither answered nor skipped the question.
export function shouldAskLearner() {
  if (!loggingAllowed()) return false
  try {
    return !getLearner() && !sessionStorage.getItem(SKIP_KEY)
  } catch {
    return !memoryLearner
  }
}

export function skipLearner() {
  try {
    sessionStorage.setItem(SKIP_KEY, '1')
  } catch {
    // ignore
  }
}

export function logEvent(type, topic = '', data = {}) {
  if (!loggingAllowed()) return
  try {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sid: sessionId(), type, topic, data, learner: getLearner() }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // logging must never affect the learner
  }
}

// Logs once per browser tab for a given key, such as the start of a session.
export function logOnce(key, type, topic = '', data = {}) {
  try {
    const flag = `mlx.logged.${key}`
    if (sessionStorage.getItem(flag)) return
    sessionStorage.setItem(flag, '1')
  } catch {
    // if storage is blocked, log anyway
  }
  logEvent(type, topic, data)
}
