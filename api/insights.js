// GET /api/insights -> class-level summary of the logged events. Teacher passcode required.
import { isTeacher } from './_teacherAuth.js'
import { recentEvents, supabaseConfigured } from './_supabase.js'

const pct = (n, d) => (d ? Math.round((n / d) * 100) : null)
const avg = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null)

export function summarise(rows) {
  const sessions = new Set(rows.map((r) => r.sid))
  const byTopic = {}
  const latest = {} // sid|topic|kind -> newest assessment event (rows arrive newest first)
  const missed = {}
  const questions = []
  const langs = {}
  let experiments = 0
  let coach = 0
  let codeRuns = 0
  let codeErrors = 0

  for (const r of rows) {
    const t = r.topic || 'other'
    byTopic[t] = byTopic[t] || { sessions: new Set(), experiments: 0 }
    byTopic[t].sessions.add(r.sid)
    if (r.type === 'experiment') {
      experiments += 1
      byTopic[t].experiments += 1
    } else if (r.type === 'coach_question') {
      coach += 1
      const lang = r.data?.lang || 'en'
      langs[lang] = (langs[lang] || 0) + 1
      if (questions.length < 8 && r.data?.q) questions.push({ topic: r.topic, q: String(r.data.q).slice(0, 160) })
    } else if (r.type === 'code_run') {
      codeRuns += 1
      if (r.data?.ok === false) codeErrors += 1
    } else if (r.type === 'pretest_done' || r.type === 'posttest_done') {
      const key = `${r.sid}|${r.topic}|${r.type}`
      if (!latest[key]) latest[key] = r
      if (r.type === 'pretest_done') {
        for (const c of r.data?.missed || []) missed[c] = (missed[c] || 0) + 1
      }
    }
  }

  const assessments = {}
  for (const r of Object.values(latest)) {
    const a = (assessments[r.topic] = assessments[r.topic] || { pre: [], post: [], gain: [] })
    const score = pct(r.data?.correct, r.data?.total)
    if (score === null) continue
    ;(r.type === 'pretest_done' ? a.pre : a.post).push(score)
  }
  // Gain only for learners who did both tests on the same topic, on the same questions.
  for (const [key, post] of Object.entries(latest)) {
    if (!key.endsWith('|posttest_done')) continue
    const [sid, topic] = key.split('|')
    const pre = latest[`${sid}|${topic}|pretest_done`]
    const sameTotal = pre && post.data?.sameTotal
    if (pre && sameTotal) {
      const a = assessments[topic]
      a.gain.push(pct(post.data.sameCorrect, post.data.sameTotal) - pct(pre.data.correct, pre.data.total))
    }
  }

  return {
    sessions: sessions.size,
    events: rows.length,
    experiments,
    coachQuestions: coach,
    coachLanguages: langs,
    codeRuns,
    codeErrors,
    topics: Object.fromEntries(Object.entries(byTopic).map(([t, v]) => [t, { sessions: v.sessions.size, experiments: v.experiments }])),
    assessments: Object.fromEntries(
      Object.entries(assessments).map(([t, a]) => [t, { pretests: a.pre.length, posttests: a.post.length, avgPre: avg(a.pre), avgPost: avg(a.post), avgGain: avg(a.gain), paired: a.gain.length }]),
    ),
    mostMissed: Object.entries(missed)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([concept, count]) => ({ concept, count })),
    recentQuestions: questions,
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET' })
  if (!isTeacher(req)) return res.status(401).json({ error: 'Teacher passcode required' })
  if (!supabaseConfigured()) return res.status(200).json({ configured: false })
  try {
    return res.status(200).json({ configured: true, ...summarise(await recentEvents()) })
  } catch (err) {
    console.error('Insights failed:', err.message)
    return res.status(502).json({ error: 'Could not read the log database.' })
  }
}
