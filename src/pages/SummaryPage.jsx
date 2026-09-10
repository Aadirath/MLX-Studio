import { Link, useParams } from 'react-router-dom'
import { TOPICS } from '../data/topics.js'
import { useSession } from '../context/SessionContext.jsx'
import NotFound from './NotFound.jsx'
import '../styles/paper.css'

function SummaryPage() {
  const { topicId } = useParams()
  const { getSession } = useSession()
  const topic = TOPICS[topicId]

  if (!topic) return <NotFound />

  const session = getSession(topicId)

  return (
    <section className="paper">
      <div className="board sumBox">
        <h1>Session summary</h1>
        <div className="sumStat">
          <span>Topic</span>
          <b>{topic.name}</b>
        </div>
        <div className="sumStat">
          <span>Steps taken in simulation</span>
          <b>{session.steps}</b>
        </div>
        <div className="sumStat">
          <span>Quiz score</span>
          <b>
            {session.quizCorrect} / {session.quizTotal}
          </b>
        </div>
        <div className="sumFooter">
          <Link className="ghostBtn" to={`/topic/${topicId}`}>
            Restart this topic
          </Link>
          <Link className="primaryBtn" to="/">
            Explore another topic
          </Link>
        </div>
      </div>
    </section>
  )
}

export default SummaryPage
