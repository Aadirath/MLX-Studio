import { useEffect, useState } from 'react'
import { Link, Outlet } from 'react-router-dom'
import ModeCompare from '../ModeCompare.jsx'
import '../../styles/paper.css'
import './TeacherGate.css'

// Wraps every /teacher page. The server checks the passcode and sets a signed cookie (see api/teacher-login.js).
// The local dev server has no /api, so the gate is open there.
function TeacherGate() {
  const [state, setState] = useState(import.meta.env.DEV ? 'open' : 'checking') // checking | locked | open | unconfigured
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (import.meta.env.DEV) return undefined
    let cancelled = false
    fetch('/api/teacher-session', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setState(d.ok ? 'open' : d.configured ? 'locked' : 'unconfigured')
      })
      .catch(() => {
        if (!cancelled) setState('locked')
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function submit(e) {
    e.preventDefault()
    if (!passcode || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/teacher-login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setPasscode('')
        setState('open')
      } else {
        setError(data.error || 'Could not check the passcode. Try again.')
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }

  if (state === 'open') return <Outlet />

  return (
    <section className="paper teacherGate">
      <h1>Teacher mode</h1>
      {state === 'checking' ? (
        <p className="sub">Checking access…</p>
      ) : state === 'unconfigured' ? (
        <p className="sub">
          Teacher mode has no passcode yet, so it is closed. The site owner needs to set <code>TEACHER_PASSCODE</code> in
          the hosting settings.
        </p>
      ) : (
        <form className="teacherGateForm" onSubmit={submit}>
          <p className="sub">
            Teacher mode is for instructors who teach a room. Enter the class passcode to open it. Students do not need
            it: everything for learning is in the lessons.
          </p>
          <label htmlFor="teacher-passcode">Class passcode</label>
          <div className="teacherGateRow">
            <input
              id="teacher-passcode"
              type="password"
              autoComplete="off"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              aria-describedby={error ? 'teacher-passcode-error' : undefined}
            />
            <button type="submit" className="btn btn--primary primaryBtn" disabled={busy || !passcode}>
              {busy ? 'Checking…' : 'Open teacher mode'}
            </button>
          </div>
          {error && (
            <p id="teacher-passcode-error" className="teacherGateError" role="alert">
              {error}
            </p>
          )}
        </form>
      )}
      <h2 className="teacherGateH2">Student mode and teacher mode</h2>
      <ModeCompare compact />
      <p>
        <Link to="/">Back to the lessons</Link>
      </p>
    </section>
  )
}

export default TeacherGate
