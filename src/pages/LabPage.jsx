import { useEffect, useState } from 'react'
import { Link, NavLink, useParams } from 'react-router-dom'
import { QUIZ, TOPICS } from '../data/topics.js'
import { ASSUMPTIONS, LAB_CONTENT, LAB_SECTIONS, LAB_SECTION_IDS, PRETEST_ITEMS } from '../data/labContent.js'
import { conceptFor } from '../data/pretestMap.js'
import { scoreOn, useSession } from '../context/SessionContext.jsx'
import AssessmentRunner from '../components/AssessmentRunner.jsx'
import VideoEmbed from '../components/VideoEmbed.jsx'
import TheorySplit from '../components/theory/TheorySplit.jsx'
import LinearRegressionPage from './LinearRegressionPage.jsx'
import KMeansPage from './KMeansPage.jsx'
import GradientDescentPage from './GradientDescentPage.jsx'
import NotFound from './NotFound.jsx'
import '../styles/paper.css'
import '../styles/lab.css'

const SIMULATIONS = {
  'linear-regression': LinearRegressionPage,
  'k-means': KMeansPage,
  'gradient-descent': GradientDescentPage,
}

const TEACHER_PATHS = {
  'linear-regression': '/teacher/linear-regression',
  'k-means': '/teacher/k-means',
  'gradient-descent': '/teacher/gradient-descent',
}

function quizItems(topicId, indices) {
  return indices.map((index) => ({ index, ...QUIZ[topicId][index] }))
}

function allIndices(topicId) {
  return QUIZ[topicId].map((_, i) => i)
}

// ---------- sidebar ----------

function LabSidebar({ topicId, topic, current }) {
  const { getAssessment } = useSession()
  const a = getAssessment(topicId)
  const done = { pretest: Boolean(a.pre), posttest: Boolean(a.post) }
  return (
    <nav className="labNav" aria-label={`${topic.name} sections`}>
      <div className="labNavHead">
        <span className="labNavIco" aria-hidden="true">
          {topic.ico}
        </span>
        <span className="labNavTopic">{topic.name}</span>
      </div>
      <ol className="labNavList">
        {LAB_SECTIONS.map((s, i) => (
          <li key={s.id}>
            <NavLink
              to={`/topic/${topicId}/${s.id}`}
              className={`labNavItem${s.id === current ? ' active' : ''}`}
              aria-current={s.id === current ? 'page' : undefined}
            >
              <span className="labNavNum">{done[s.id] ? '✓' : i + 1}</span>
              <span>{s.label}</span>
            </NavLink>
          </li>
        ))}
      </ol>
      <Link className="labNavTeacher" to={TEACHER_PATHS[topicId]}>
        Open in Teacher Mode →
      </Link>
    </nav>
  )
}

function PrevNext({ topicId, current }) {
  const i = LAB_SECTION_IDS.indexOf(current)
  const prev = LAB_SECTIONS[i - 1]
  const next = LAB_SECTIONS[i + 1]
  return (
    <div className="labPrevNext">
      {prev ? (
        <Link className="btn btn--ghost ghostBtn" to={`/topic/${topicId}/${prev.id}`}>
          ← {prev.label}
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link className="btn btn--primary primaryBtn" to={`/topic/${topicId}/${next.id}`}>
          {next.label} →
        </Link>
      )}
    </div>
  )
}

// ---------- sections ----------

function AimSection({ topicId, topic, content }) {
  return (
    <div className="labCard">
      <p className="labKicker">Aim</p>
      <h1>{topic.name}</h1>
      <p className="labLead">{content.aim}</p>
      <div className="labTwoCol">
        <div>
          <div className="panel__label sectionLabel">Learning objectives</div>
          <ul className="objList">
            {topic.objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="panel__label sectionLabel">Prerequisites</div>
          <ul className="objList">
            {topic.prereqs.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <div className="panel__label sectionLabel">Time</div>
          <span className="pill">{topic.time}</span>
        </div>
      </div>
      <div className="labPath" aria-label="How this lab works">
        {LAB_SECTIONS.slice(1).map((s) => (
          <Link key={s.id} to={`/topic/${topicId}/${s.id}`} className="labPathStep">
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  )
}

function TheorySection({ topicId, topic, content }) {
  return (
    <div className="labCard">
      <p className="labKicker">Theory</p>
      <h1>The ideas behind {topic.name.toLowerCase()}</h1>
      {topic.video?.youtubeId && (
        <details className="labVideo">
          <summary>Watch a short video first (optional)</summary>
          <VideoEmbed video={topic.video} />
        </details>
      )}
      <TheorySplit topicId={topicId} blocks={content.theory} />
    </div>
  )
}

function AssumptionsSection({ topic, a }) {
  return (
    <div className="labCard">
      <p className="labKicker">Assumptions</p>
      <h1>Cost, assumptions and when to use {topic.name.toLowerCase()}</h1>

      <section className="costCard">
        <p className="sectionLabel">Cost function: the number the algorithm makes as small as possible</p>
        <p className="costName">{a.cost.name}</p>
        <div className="theoryFormula">{a.cost.formula}</div>
        <p className="theoryNote">{a.cost.meaning}</p>
      </section>

      <h2 className="labH2">What the data must look like</h2>
      <div className="assumeTableWrap">
        <table className="assumeTable">
          <thead>
            <tr>
              <th>Assumption</th>
              <th>In plain words</th>
              <th>How to check</th>
              <th>If it is broken</th>
            </tr>
          </thead>
          <tbody>
            {a.list.map((row) => (
              <tr key={row.name}>
                <th scope="row">{row.name}</th>
                <td>{row.plain}</td>
                <td>{row.check}</td>
                <td>{row.broken}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="useAvoid">
        <div className="useCol">
          <h2 className="labH2">Use it when</h2>
          <ul>
            {a.use.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </div>
        <div className="avoidCol">
          <h2 className="labH2">Avoid it when</h2>
          <ul>
            {a.avoid.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </div>
      </div>

      <p className="tryIt">
        <b>See an assumption break:</b> {a.tryIt}
      </p>
    </div>
  )
}

function ScoreBar({ label, score }) {
  const pct = score ? (score.correct / score.total) * 100 : 0
  return (
    <div className="scoreRow">
      <span className="scoreLabel">{label}</span>
      <span className="scoreTrack">
        <span className="scoreFill" style={{ width: `${pct}%` }} />
      </span>
      <b className="scoreVal">{score ? `${score.correct} / ${score.total}` : 'not taken'}</b>
    </div>
  )
}

// Right or wrong for each pretest question, plus where to look in the simulation. The correct answers stay hidden
// until the posttest, so the before-and-after comparison stays fair.
function PretestReview({ topicId, result }) {
  const items = PRETEST_ITEMS[topicId]
  return (
    <ol className="reviewList" aria-label="Your pretest, question by question">
      {items.map((index) => {
        const ok = Boolean(result?.correctByItem?.[index])
        const { concept, tryThis } = conceptFor(topicId, index)
        return (
          <li key={index} className={`reviewRow ${ok ? 'reviewRow--ok' : 'reviewRow--miss'}`}>
            <span className="reviewMark" aria-label={ok ? 'Right' : 'Missed'}>
              {ok ? '✓' : '✗'}
            </span>
            <div>
              <p className="reviewPrompt">{QUIZ[topicId][index].prompt}</p>
              <p className="reviewConcept">
                <b>{concept}.</b> {ok ? 'You have this one.' : `Try this: ${tryThis}`}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

// Shown above the simulation: the ideas this learner missed in the pretest and what to try for each.
function PretestFocus({ topicId }) {
  const { getAssessment } = useSession()
  const pre = getAssessment(topicId).pre
  if (!pre) {
    return (
      <div className="focusCard focusCard--empty">
        <p>
          <b>Tip:</b> take the <Link to={`/topic/${topicId}/pretest`}>pretest</Link> first. This page will then point you at
          the ideas to look for.
        </p>
      </div>
    )
  }
  const missed = PRETEST_ITEMS[topicId].filter((i) => pre.correctByItem?.[i] === false)
  return (
    <details className="focusCard" open={missed.length > 0}>
      <summary>
        {missed.length === 0
          ? 'From your pretest: you answered every question right. Use the simulation to test the edges.'
          : `From your pretest: ${missed.length} idea${missed.length === 1 ? '' : 's'} to look for while you experiment`}
      </summary>
      {missed.length > 0 && (
        <ul className="focusList">
          {missed.map((i) => {
            const { concept, tryThis } = conceptFor(topicId, i)
            return (
              <li key={i}>
                <b>{concept}.</b> {tryThis}
              </li>
            )
          })}
        </ul>
      )}
    </details>
  )
}

// Posttest: each pretest idea, before and after.
function ConceptCompare({ topicId, pre, post }) {
  if (!pre || !post) return null
  const change = (before, after) => {
    if (before === undefined || after === undefined) return ''
    if (!before && after) return 'Fixed'
    if (!before && !after) return 'Still missed'
    if (before && !after) return 'Slipped'
    return 'Kept'
  }
  return (
    <div className="conceptCompare">
      <p className="panel__label sectionLabel">Idea by idea</p>
      <table className="conceptTable">
        <thead>
          <tr>
            <th scope="col">Idea</th>
            <th scope="col">Pretest</th>
            <th scope="col">Posttest</th>
            <th scope="col">Result</th>
          </tr>
        </thead>
        <tbody>
          {PRETEST_ITEMS[topicId].map((i) => {
            const before = pre.correctByItem?.[i]
            const after = post.correctByItem?.[i]
            const { concept, tryThis } = conceptFor(topicId, i)
            const verdict = change(before, after)
            return (
              <tr key={i}>
                <th scope="row">{concept}</th>
                <td>{before === undefined ? '–' : before ? '✓' : '✗'}</td>
                <td>{after === undefined ? '–' : after ? '✓' : '✗'}</td>
                <td>
                  {verdict}
                  {(verdict === 'Still missed' || verdict === 'Slipped') && <span className="conceptTry"> Try this: {tryThis}</span>}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function PretestSection({ topicId, topic }) {
  const { getAssessment, recordAssessment } = useSession()
  const items = PRETEST_ITEMS[topicId]
  const existing = getAssessment(topicId).pre
  const [running, setRunning] = useState(false)
  const score = scoreOn(existing, items)

  return (
    <div className="labCard">
      <p className="labKicker">Pretest</p>
      <h1>What do you already know?</h1>
      {running ? (
        <AssessmentRunner
          items={quizItems(topicId, items)}
          mode="pre"
          onFinish={(res) => {
            recordAssessment(topicId, 'pre', res)
            setRunning(false)
          }}
        />
      ) : existing ? (
        <>
          <p className="labLead">
            Pretest done. Below is each question with a pointer to what to try in the simulation. The correct answers
            come in the posttest, which asks these {items.length} questions again so you can see how much the simulation
            helped.
          </p>
          <ScoreBar label="Pretest" score={score} />
          <PretestReview topicId={topicId} result={existing} />
          <div className="labActions">
            <Link className="btn btn--primary primaryBtn" to={`/topic/${topicId}/simulation`}>
              Open the simulation →
            </Link>
            <Link className="btn btn--ghost ghostBtn" to={`/topic/${topicId}/procedure`}>
              Read the procedure first
            </Link>
            <button type="button" className="btn btn--ghost ghostBtn" onClick={() => setRunning(true)}>
              Retake pretest
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="labLead">
            {items.length} quick questions about {topic.name.toLowerCase()}. Answer with your best guess. Afterwards you
            will see which ones you missed and what to try in the simulation, but not the correct answers: the posttest
            asks the same questions again, and that keeps the comparison fair.
          </p>
          <button type="button" className="btn btn--primary primaryBtn" onClick={() => setRunning(true)}>
            Start the pretest
          </button>
        </>
      )}
    </div>
  )
}

function ProcedureSection({ topicId, content }) {
  return (
    <div className="labCard">
      <p className="labKicker">Procedure</p>
      <h1>How to do the experiment</h1>
      <ol className="procList">
        {content.procedure.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <Link className="btn btn--primary primaryBtn" to={`/topic/${topicId}/simulation`}>
        Open the simulation →
      </Link>
    </div>
  )
}

function PosttestSection({ topicId }) {
  const { getAssessment, recordAssessment, recordQuizResult } = useSession()
  const a = getAssessment(topicId)
  const [running, setRunning] = useState(false)
  const preItems = PRETEST_ITEMS[topicId]
  const all = allIndices(topicId)
  const preScore = scoreOn(a.pre, preItems)
  const postSameScore = scoreOn(a.post, preItems)
  const postAllScore = scoreOn(a.post, all)
  const gain = preScore && postSameScore ? postSameScore.correct - preScore.correct : null

  return (
    <div className="labCard">
      <p className="labKicker">Posttest</p>
      <h1>Check your understanding</h1>
      {running ? (
        <AssessmentRunner
          items={quizItems(topicId, all)}
          mode="post"
          onFinish={(res) => {
            recordAssessment(topicId, 'post', res)
            recordQuizResult(topicId, Object.values(res).filter(Boolean).length, all.length)
            setRunning(false)
          }}
        />
      ) : a.post ? (
        <>
          <p className="labLead">
            {gain === null
              ? 'Posttest done.'
              : gain > 0
                ? `You answered ${gain} more of the pretest questions correctly after the simulation.`
                : gain === 0
                  ? 'Same score on the pretest questions as before. Revisit the theory or the simulation for the ones you missed.'
                  : 'You scored lower on the pretest questions this time. Revisit the theory and try again.'}
          </p>
          <div className="scoreCard">
            <ScoreBar label="Pretest" score={preScore} />
            <ScoreBar label="Same questions, after" score={postSameScore} />
            <ScoreBar label="Full posttest" score={postAllScore} />
          </div>
          <ConceptCompare topicId={topicId} pre={a.pre} post={a.post} />
          <div className="labActions">
            <Link className="btn btn--primary primaryBtn" to={`/topic/${topicId}/summary`}>
              See session summary
            </Link>
            <button type="button" className="btn btn--ghost ghostBtn" onClick={() => setRunning(true)}>
              Retake posttest
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="labLead">
            {all.length} questions, with the answer and an explanation after each one.
            {!a.pre && ' You skipped the pretest, so there will be no before-and-after comparison.'}
          </p>
          <button type="button" className="btn btn--primary primaryBtn" onClick={() => setRunning(true)}>
            Start the posttest
          </button>
        </>
      )}
    </div>
  )
}

function ReferencesSection({ content }) {
  return (
    <div className="labCard">
      <p className="labKicker">References</p>
      <h1>Read and explore further</h1>
      <ul className="refList">
        {content.references.map((r) => (
          <li key={r.href + r.title}>
            <a href={r.href} target="_blank" rel="noopener noreferrer">
              {r.title}
            </a>
            <span>{r.source}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------- page ----------

function LabPage() {
  const { topicId, section = 'aim' } = useParams()
  const topic = TOPICS[topicId]
  const content = LAB_CONTENT[topicId]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [topicId, section])

  if (!topic || !content || !LAB_SECTION_IDS.includes(section)) return <NotFound />

  const Simulation = SIMULATIONS[topicId]
  let body
  if (section === 'aim') body = <AimSection topicId={topicId} topic={topic} content={content} />
  else if (section === 'theory') body = <TheorySection topicId={topicId} topic={topic} content={content} />
  else if (section === 'assumptions') body = <AssumptionsSection topic={topic} a={ASSUMPTIONS[topicId]} />
  else if (section === 'pretest') body = <PretestSection key={topicId} topicId={topicId} topic={topic} />
  else if (section === 'procedure') body = <ProcedureSection topicId={topicId} content={content} />
  else if (section === 'simulation')
    body = (
      <>
        <PretestFocus topicId={topicId} />
        <Simulation />
      </>
    )
  else if (section === 'posttest') body = <PosttestSection key={topicId} topicId={topicId} />
  else body = <ReferencesSection content={content} />

  return (
    <section className="paper lab">
      <LabSidebar topicId={topicId} topic={topic} current={section} />
      <div className="labMain">
        {body}
        <PrevNext topicId={topicId} current={section} />
      </div>
    </section>
  )
}

export default LabPage
