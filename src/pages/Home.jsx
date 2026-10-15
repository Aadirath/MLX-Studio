import { Link } from 'react-router-dom'
import { TOPICS } from '../data/topics.js'
import TerrainHero from '../components/TerrainHero.jsx'
import { TopicArt } from '../components/TopicArt.jsx'
import { IconChat, IconData, IconPredict, IconSound } from '../components/ShellIcons.jsx'
import '../styles/paper.css'
import '../styles/shell.css'

// Recommended order: gradient descent builds on linear regression.
const ORDER = ['linear-regression', 'gradient-descent', 'k-means']

const CAPABILITIES = [
  {
    Icon: IconPredict,
    title: 'Predict first',
    text: 'The coach asks for your guess before it explains, then points you to the next experiment to try.',
  },
  {
    Icon: IconChat,
    title: 'Ask in your language',
    text: 'Hints in English, हिन्दी or मराठी, and a Listen button that reads them aloud.',
  },
  {
    Icon: IconSound,
    title: 'Hear the error',
    text: 'Pitch follows the error, so you can hear a run settle, bounce or blow up.',
  },
  {
    Icon: IconData,
    title: 'Bring your own data',
    text: 'Type points or upload a CSV in linear regression and K-means, or pick a preset dataset in gradient descent.',
  },
]

function Home() {
  const topics = ORDER.filter((id) => TOPICS[id]).map((id) => [id, TOPICS[id]])

  const jumpToTopics = (event) => {
    event.preventDefault()
    const el = document.getElementById('topics')
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <>
      <section className="mx-hero" aria-label="Introduction">
        <TerrainHero />
        <div className="mx-hero__fade" />
        <div className="mx-hero__in">
          <h1 className="mx-display">See how a model learns.</h1>
          <p className="mx-lede">Step through an algorithm, change one setting at a time, and watch what happens to the error.</p>
          <div className="mx-cta">
            <Link className="mx-btn mx-btn--primary" to="/topic/linear-regression">
              Start with linear regression
            </Link>
            <a className="mx-btn mx-btn--quiet" href="#topics" onClick={jumpToTopics}>
              Browse topics
            </a>
          </div>
          <p className="mx-caption">Each trail is gradient descent from a different starting point, rolling toward the lowest error.</p>
        </div>
      </section>

      <section className="mx-wrap mx-section" id="topics" aria-labelledby="mx-topics-h">
        <h2 id="mx-topics-h">Choose a topic</h2>
        <ul className="mx-topics">
          {topics.map(([id, topic], i) => (
            <li className="mx-topic" key={id}>
              <div className="mx-topic__art">
                <TopicArt id={id} />
              </div>
              <div>
                <h3>{topic.name}</h3>
                <p>{topic.blurb}</p>
              </div>
              <div className="mx-topic__meta">
                <span>{topic.time}</span>
                <span>{topic.objectives.length} learning objectives</span>
              </div>
              <Link className={`mx-btn ${i === 0 ? 'mx-btn--primary' : 'mx-btn--quiet'}`} to={`/topic/${id}`} aria-label={`Open ${topic.name}`}>
                Open
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-wrap mx-section mx-caps" aria-labelledby="mx-caps-h">
        <h2 id="mx-caps-h">What every lesson gives you</h2>
        <dl>
          {CAPABILITIES.map(({ Icon, title, text }) => (
            <div key={title}>
              <dt>
                <Icon />
                {title}
              </dt>
              <dd>{text}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}

export default Home
