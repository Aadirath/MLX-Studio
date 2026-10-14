import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import LinearRegression from '../components/LinearRegression.jsx'
import AIAssistantPanel from '../components/AIAssistantPanel.jsx'
import RestartLessonButton from '../components/RestartLessonButton.jsx'
import { clearSessionState } from '../hooks/useSessionState.js'
import { useSession } from '../context/SessionContext.jsx'
import '../styles/paper.css'

const TOPIC_ID = 'linear-regression'

function LinearRegressionPage() {
  const { recordSteps } = useSession()
  const [stateDescription, setStateDescription] = useState('')
  const [runId, setRunId] = useState(0)
  const handleRestart = () => {
    clearSessionState(`mlx.${TOPIC_ID}.`)
    setRunId((n) => n + 1)
  }
  const handleStepsChange = useCallback((steps) => recordSteps(TOPIC_ID, steps), [recordSteps])

  return (
    <>
      <div className="bench" role="region" aria-labelledby="labTitle">
        <div className="benchTop">
          <div>
            <h1 className="lab-title" id="labTitle">
              Linear regression
            </h1>
            <p className="aim">Fit a line, tune parameters, see the error change.</p>
          </div>
          <RestartLessonButton onRestart={handleRestart} />
        </div>
        <LinearRegression key={runId} onStepsChange={handleStepsChange} onStateDescription={setStateDescription} />
        <div className="quizCta" style={{ gap: 10 }}>
          <Link className="btn btn--ghost ghostBtn" to="/linear-regression/sandbox">
            Try your own data (sandbox)
          </Link>
          <Link className="btn btn--primary primaryBtn" to={`/topic/${TOPIC_ID}/posttest`}>
            Go to the posttest →
          </Link>
        </div>
      </div>
      <aside className="dock" aria-label="Coach">
        <AIAssistantPanel topic={TOPIC_ID} stateDescription={stateDescription} />
      </aside>
    </>
  )
}

export default LinearRegressionPage
