import { Link, useParams } from 'react-router-dom'
import { TOPICS, TOPIC_PLAYGROUND_PATHS } from '../data/topics.js'
import NotFound from './NotFound.jsx'
import VideoEmbed from '../components/VideoEmbed.jsx'
import '../styles/paper.css'

function TopicOverviewPage() {
  const { topicId } = useParams()
  const topic = TOPICS[topicId]

  if (!topic) return <NotFound />

  return (
    <section className="paper">
      <div className="board ovBox">
        <h1>{topic.name}</h1>
        <p className="sub">{topic.blurb}</p>

        <div className="sectionLabel">Learning objectives</div>
        <ul className="objList">
          {topic.objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>

        <div className="sectionLabel">Prerequisites</div>
        <ul className="preList">
          {topic.prereqs.map((prereq) => (
            <li key={prereq}>
              <span className="box" />
              {prereq}
            </li>
          ))}
        </ul>

        {topic.video?.youtubeId && (
          <>
            <div className="sectionLabel">Watch first (optional)</div>
            <VideoEmbed video={topic.video} />
          </>
        )}

        <div className="ovFooter">
          <span className="pill">{topic.time}</span>
          <Link className="primaryBtn" to={TOPIC_PLAYGROUND_PATHS[topicId]}>
            Start learning
          </Link>
        </div>
        {topicId === 'linear-regression' && (
          <p className="sub" style={{ margin: '14px 0 0' }}>
            Already know the basics? <Link className="sandboxLink" to="/linear-regression/sandbox">Try your own data</Link>
          </p>
        )}
      </div>
    </section>
  )
}

export default TopicOverviewPage
