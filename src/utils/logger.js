// Sends anonymous usage events to /api/log. Nothing here ever blocks or breaks the app.
// No names, emails or IP addresses are collected. Browsers that send "Do Not Track" are respected.

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

export function logEvent(type, topic = '', data = {}) {
  if (!loggingAllowed()) return
  try {
    fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sid: sessionId(), type, topic, data }),
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
