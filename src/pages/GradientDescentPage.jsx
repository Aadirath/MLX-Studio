import { useState } from 'react'
import { Link } from 'react-router-dom'
import AIAssistantPanel from '../components/AIAssistantPanel.jsx'
import ExperimentLog from '../components/ExperimentLog.jsx'
import GoFurtherPanel from '../components/GoFurtherPanel.jsx'
import GradientDescent from '../components/GradientDescent.jsx'
import RestartLessonButton from '../components/RestartLessonButton.jsx'
import { useExperimentLog } from '../hooks/useExperimentLog.js'
import { clearSessionState } from '../hooks/useSessionState.js'
import '../styles/paper.css'

const TOPIC_ID = 'gradient-descent'

function GradientDescentPage() {
  const [stateDescription, setStateDescription] = useState('')
  const [runId, setRunId] = useState(0)
  const { entries, addEntry, clear } = useExperimentLog(TOPIC_ID)
  const handleRestart = () => {
    clearSessionState(`mlx.${TOPIC_ID}.`)
    setRunId((n) => n + 1)
  }
  return (
    <>
      <div className="bench" role="region" aria-labelledby="labTitle">
        <div className="benchTop">
          <div>
            <h1 className="lab-title" id="labTitle">
              Gradient descent — finding the bottom of the bowl
            </h1>
            <p className="aim">
              Start somewhere on the error surface and keep stepping downhill. Change the learning rate and watch the
              path.
            </p>
          </div>
          <RestartLessonButton onRestart={handleRestart} />
        </div>
        <GradientDescent key={runId} onStateDescription={setStateDescription} onExperiment={addEntry} />
        <GoFurtherPanel topic="gradientDescent" />
        <p className="hint">
          Linear Regression&apos;s guided lesson jumps straight to the exact formula (OLS). This is the other way to
          solve the same problem: start anywhere, and repeatedly nudge downhill until you reach the lowest error. The
          surface plots every possible slope and intercept against how wrong that line would be. Same dataset as the
          Linear Regression lesson: area (100 sq ft) vs. price (₹ lakh), 10 listings. The star marks the exact answer
          OLS computes directly.
        </p>
        <div className="quizCta">
          <Link className="btn btn--primary primaryBtn" to={`/topic/${TOPIC_ID}/posttest`}>
            Go to the posttest →
          </Link>
        </div>
      </div>
      <aside className="dock" aria-label="Coach and experiments">
        <AIAssistantPanel
          topic={TOPIC_ID}
          stateDescription={stateDescription}
          history={entries.slice(-6).map((e) => e.text)}
        />
        <ExperimentLog topicKey={TOPIC_ID} entries={entries} onClear={clear} />
      </aside>
    </>
  )
}

export default GradientDescentPage
