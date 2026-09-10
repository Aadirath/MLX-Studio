import { Link } from 'react-router-dom'
import { TOPICS } from '../data/topics.js'
import '../styles/paper.css'

function Home() {
  return (
    <section className="paper">
      <h1>Choose a topic to begin</h1>
      <p className="sub">Read a short overview, then step through an interactive simulation at your own pace.</p>
      <div className="cards">
        {Object.entries(TOPICS).map(([topicId, topic]) => (
          <div className="card" key={topicId}>
            <div className="ico">{topic.ico}</div>
            <h3>{topic.name}</h3>
            <p>{topic.blurb}</p>
            <Link className="cardBtn" to={`/topic/${topicId}`}>
              Start
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

export default Home
