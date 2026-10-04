import { useState } from 'react'
import './AIAssistantPanel.css'

const FALLBACK_HINTS = {
  'linear-regression':
    'Look at the vertical gaps between each point and the line. Which change to the slope or intercept would make those gaps smaller overall?',
  'k-means':
    'Pick one point and compare its distance to each centroid. Which centroid is closest, and how would the centroids move once the groups change?',
  'gradient-descent':
    'Look at where the blue dot sits on the error surface. Which direction is downhill from there, and how did the error change after the last step?',
}

function AIAssistantPanel({ topic, stateDescription = '' }) {
  const [question, setQuestion] = useState('')
  const [reply, setReply] = useState(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(false)

  async function ask(e) {
    e.preventDefault()
    const q = question.trim()
    if (!q || loading) return
    setLoading(true)
    setFailed(false)
    setReply(null)
    try {
      const res = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, stateDescription, question: q }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!data || typeof data.reply !== 'string' || !data.reply) throw new Error('Empty reply')
      setReply(data.reply)
    } catch {
      setFailed(true)
      setReply(FALLBACK_HINTS[topic] || 'Look closely at what changed on screen after your last action.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className="aiPanel" aria-label="AI assistant">
      <h2 className="aiTitle">Stuck? Ask for a hint</h2>
      <form className="aiForm" onSubmit={ask}>
        <textarea
          className="aiInput"
          rows={2}
          maxLength={500}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="What are you unsure about?"
          aria-label="Your question"
        />
        <button className="primaryBtn aiAsk" type="submit" disabled={loading || !question.trim()}>
          {loading ? 'Thinking…' : 'Ask'}
        </button>
      </form>
      <div className="aiReply" aria-live="polite">
        {loading && <p className="aiLoading">Thinking of a hint…</p>}
        {!loading && failed && (
          <p className="aiError">The assistant is unavailable right now, so here is a general hint instead.</p>
        )}
        {!loading && reply && <p className="aiText">{reply}</p>}
      </div>
    </aside>
  )
}

export default AIAssistantPanel
