import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import KMeans from '../components/KMeans.jsx'
import AIAssistantPanel from '../components/AIAssistantPanel.jsx'
import ExperimentLog from '../components/ExperimentLog.jsx'
import RestartLessonButton from '../components/RestartLessonButton.jsx'
import { useExperimentLog } from '../hooks/useExperimentLog.js'
import { clearSessionState } from '../hooks/useSessionState.js'
import { useSession } from '../context/SessionContext.jsx'
import '../styles/paper.css'

const TOPIC_ID = 'k-means'

function KMeansPage() {
  const { recordSteps } = useSession()
  const [stateDescription, setStateDescription] = useState('')
  const [runId, setRunId] = useState(0)
  const handleRestart = () => {
    clearSessionState(`mlx.${TOPIC_ID}.`)
    setRunId((n) => n + 1)
  }
  const { entries, addEntry, clear } = useExperimentLog(TOPIC_ID)
  const handleStepsChange = useCallback((steps) => recordSteps(TOPIC_ID, steps), [recordSteps])

  return (
    <>
      <div className="bench" role="region" aria-labelledby="labTitle">
        <div className="benchTop">
          <div>
            <h1 className="lab-title" id="labTitle">
              K-means clustering
            </h1>
            <p className="aim">Group points, watch centroids move each iteration.</p>
          </div>
          <RestartLessonButton onRestart={handleRestart} />
        </div>
        <KMeans
          key={runId}
          onStepsChange={handleStepsChange}
          onStateDescription={setStateDescription}
          onExperiment={addEntry}
        />
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

export default KMeansPage
