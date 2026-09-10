import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const SessionContext = createContext(null)

function emptySession() {
  return { steps: 0, quizCorrect: 0, quizTotal: 0 }
}

export function SessionProvider({ children }) {
  const [sessions, setSessions] = useState({})

  const recordSteps = useCallback((topicId, steps) => {
    setSessions((prev) => ({ ...prev, [topicId]: { ...emptySession(), ...prev[topicId], steps } }))
  }, [])

  const recordQuizResult = useCallback((topicId, quizCorrect, quizTotal) => {
    setSessions((prev) => ({ ...prev, [topicId]: { ...emptySession(), ...prev[topicId], quizCorrect, quizTotal } }))
  }, [])

  const getSession = useCallback((topicId) => sessions[topicId] ?? emptySession(), [sessions])

  const value = useMemo(
    () => ({ recordSteps, recordQuizResult, getSession }),
    [recordSteps, recordQuizResult, getSession],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used within a SessionProvider')
  return ctx
}
