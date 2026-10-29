import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { logEvent, logOnce, setLearner, shouldAskLearner, skipLearner } from '../utils/logger.js'
import './LearnerPrompt.css'

const TOPICS = new Set(['linear-regression', 'k-means', 'gradient-descent'])

// Records which page the learner opened and, once, asks for an optional name or roll number.
function ActivityLogger() {
  const { pathname } = useLocation()
  const [asking, setAsking] = useState(() => shouldAskLearner())
  const [name, setName] = useState('')

  useEffect(() => {
    logOnce('session', 'session_start')
  }, [])

  useEffect(() => {
    const parts = pathname.split('/').filter(Boolean)
    if (parts[0] === 'topic' && TOPICS.has(parts[1])) {
      logEvent('page_view', parts[1], { section: parts[2] || 'aim' })
    } else if (parts[0] === 'teacher') {
      logEvent('page_view', 'teacher', { page: parts[1] || 'dashboard' })
    } else {
      logEvent('page_view', '', { page: parts[0] || 'home' })
    }
  }, [pathname])

    if (!asking || pathname.startsWith('/teacher')) return null

  const submit = (event) => {
    event.preventDefault()
    if (name.trim()) {
      setLearner(name)
      logEvent('learner_set')
    } else {
      skipLearner()
    }
    setAsking(false)
  }

  const stayAnonymous = () => {
    skipLearner()
    setAsking(false)
  }

  return (
    <div className="learner-prompt" role="dialog" aria-modal="true" aria-labelledby="learner-prompt-title">
      <form className="learner-prompt__card" onSubmit={submit}>
        <h2 id="learner-prompt-title">Who is using MLX Studio?</h2>
        <p>
          Optional. Enter your name or roll number so your teacher can follow your progress. It is saved with your
          activity on the MLX Studio server. Leave it blank to stay anonymous.
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          placeholder="Name or roll number"
          aria-label="Name or roll number"
          autoFocus
        />
        <div className="learner-prompt__actions">
          <button type="submit">Continue</button>
          <button type="button" onClick={stayAnonymous}>Stay anonymous</button>
        </div>
      </form>
    </div>
  )
}

export default ActivityLogger
