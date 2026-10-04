import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import KMeans from '../components/KMeans.jsx'
import AIAssistantPanel from '../components/AIAssistantPanel.jsx'
import { useSession } from '../context/SessionContext.jsx'
import '../styles/paper.css'

const TOPIC_ID = 'k-means'

function KMeansPage() {
  const { recordSteps } = useSession()
  const [stateDescription, setStateDescription] = useState('')
  const handleStepsChange = useCallback((steps) => recordSteps(TOPIC_ID, steps), [recordSteps])

  return (
    <section className="paper">
      <h1>K-means clustering</h1>
      <p className="sub">Group points, watch centroids move each iteration.</p>
      <KMeans onStepsChange={handleStepsChange} onStateDescription={setStateDescription} />
      <AIAssistantPanel topic={TOPIC_ID} stateDescription={stateDescription} />
      <div className="quizCta">
        <Link className="primaryBtn" to={`/topic/${TOPIC_ID}/quiz`}>
          Take the quiz
        </Link>
      </div>
    </section>
  )
}

export default KMeansPage
