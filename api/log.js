// POST /api/log  { sid, type, topic, data, learner }  -> stores one usage event.
// learner is an optional name or roll number the learner chose to enter. No emails or IP addresses are stored.
// If Supabase is not configured the call is accepted and dropped, so the app never breaks because of logging.
import { insertEvent, supabaseConfigured } from './_supabase.js'

const TYPES = new Set([
  'session_start',
  'page_view',
  'pretest_done',
  'posttest_done',
  'experiment',
  'prediction',
  'coach_question',
  'code_run',
  'learner_set',
])
const TOPICS = new Set(['', 'linear-regression', 'k-means', 'gradient-descent', 'teacher'])

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })

  const { sid, type, topic = '', data = {}, learner = '' } = req.body || {}
  if (typeof sid !== 'string' || !/^[a-z0-9-]{8,48}$/i.test(sid)) return res.status(400).json({ error: 'bad sid' })
  if (!TYPES.has(type)) return res.status(400).json({ error: 'bad type' })
  if (!TOPICS.has(topic)) return res.status(400).json({ error: 'bad topic' })

  let safeData = {}
  try {
    const json = JSON.stringify(data && typeof data === 'object' ? data : {})
    safeData = json.length <= 2000 ? JSON.parse(json) : { truncated: true }
  } catch {
    safeData = {}
  }

  
  const safeLearner = typeof learner === 'string' ? learner.replace(/\p{Cc}/gu, '').trim().slice(0, 60) : ''
  if (safeLearner) safeData = { ...safeData, learner: safeLearner }
  if (!supabaseConfigured()) return res.status(202).json({ stored: false })
  try {
    await insertEvent({ sid, type, topic, data: safeData })
    return res.status(200).json({ stored: true })
  } catch (err) {
    console.error('Log endpoint failed:', err.message)
    return res.status(202).json({ stored: false })
  }
}
