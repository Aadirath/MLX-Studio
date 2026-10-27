import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { logEvent, logOnce } from '../utils/logger.js'

const TOPICS = new Set(['linear-regression', 'k-means', 'gradient-descent'])

// Renders nothing. Records which page the learner opened, as an anonymous event.
function ActivityLogger() {
  const { pathname } = useLocation()

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

  return null
}

export default ActivityLogger
