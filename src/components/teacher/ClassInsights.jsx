import { useEffect, useState } from 'react'
import './ClassInsights.css'

const TOPIC_NAMES = { 'linear-regression': 'Linear regression', 'k-means': 'K-means', 'gradient-descent': 'Gradient descent', teacher: 'Teacher mode', other: 'Other pages' }
const LANG_NAMES = { en: 'English', hi: 'Hindi', mr: 'Marathi' }

function Stat({ label, value }) {
  return (
    <div className="insStat">
      <b>{value ?? '–'}</b>
      <span>{label}</span>
    </div>
  )
}

// Reads the anonymous usage log through /api/insights (teacher passcode required).
function ClassInsights() {
  const [state, setState] = useState({ status: import.meta.env.DEV ? 'dev' : 'loading', data: null })

  useEffect(() => {
    if (import.meta.env.DEV) return undefined
    let cancelled = false
    fetch('/api/insights', { credentials: 'same-origin' })
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then((data) => {
        if (!cancelled) setState({ status: data.configured === false ? 'unconfigured' : 'ready', data })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', data: null })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const { status, data } = state
  return (
    <section className="classInsights" aria-labelledby="insights-title">
      <h2 id="insights-title">Class insights</h2>
      <p className="sub">Anonymous usage from the log database: no names, no emails. The latest 3000 events.</p>

      {status === 'loading' && <p className="sub">Loading…</p>}
      {status === 'dev' && <p className="sub">Insights read the log database, which exists only on the deployed site.</p>}
      {status === 'unconfigured' && (
        <p className="sub">
          The log database is not connected yet. Set <code>SUPABASE_URL</code> and <code>SUPABASE_SERVICE_ROLE_KEY</code> in
          the hosting settings (see the README).
        </p>
      )}
      {status === 'error' && <p className="sub">Could not read the log database just now. Try again in a moment.</p>}

      {status === 'ready' && data && (
        <>
          <div className="insStats">
            <Stat label="sessions" value={data.sessions} />
            <Stat label="experiments logged" value={data.experiments} />
            <Stat label="coach questions" value={data.coachQuestions} />
            <Stat label="code runs (errors)" value={`${data.codeRuns} (${data.codeErrors})`} />
          </div>

          <h3>Before and after</h3>
          {Object.keys(data.assessments).length === 0 ? (
            <p className="sub">No pretests or posttests yet.</p>
          ) : (
            <div className="insTableWrap">
              <table className="insTable">
                <thead>
                  <tr>
                    <th scope="col">Topic</th>
                    <th scope="col">Pretests</th>
                    <th scope="col">Avg pretest</th>
                    <th scope="col">Posttests</th>
                    <th scope="col">Avg posttest</th>
                    <th scope="col">Avg gain (same questions)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.assessments).map(([t, a]) => (
                    <tr key={t}>
                      <th scope="row">{TOPIC_NAMES[t] || t}</th>
                      <td>{a.pretests}</td>
                      <td>{a.avgPre === null ? '–' : `${a.avgPre}%`}</td>
                      <td>{a.posttests}</td>
                      <td>{a.avgPost === null ? '–' : `${a.avgPost}%`}</td>
                      <td>{a.avgGain === null ? '–' : `${a.avgGain > 0 ? '+' : ''}${a.avgGain} points (${a.paired} learners)`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="insTwoCol">
            <div>
              <h3>Ideas most missed in the pretest</h3>
              {data.mostMissed.length === 0 ? (
                <p className="sub">Nothing yet.</p>
              ) : (
                <ol className="insList">
                  {data.mostMissed.map((m) => (
                    <li key={m.concept}>
                      {m.concept} <span>{m.count}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div>
              <h3>What learners ask the coach</h3>
              {data.recentQuestions.length === 0 ? (
                <p className="sub">No questions yet.</p>
              ) : (
                <ul className="insList">
                  {data.recentQuestions.map((q, i) => (
                    <li key={i}>
                      {q.q} <span>{TOPIC_NAMES[q.topic] || q.topic}</span>
                    </li>
                  ))}
                </ul>
              )}
              {Object.keys(data.coachLanguages).length > 0 && (
                <p className="sub">
                  Languages:{' '}
                  {Object.entries(data.coachLanguages)
                    .map(([l, n]) => `${LANG_NAMES[l] || l} ${n}`)
                    .join(', ')}
                </p>
              )}
            </div>
          </div>

          <h3>Sessions by topic</h3>
          <ul className="insList">
            {Object.entries(data.topics).map(([t, v]) => (
              <li key={t}>
                {TOPIC_NAMES[t] || t} <span>{v.sessions} sessions, {v.experiments} experiments</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

export default ClassInsights
