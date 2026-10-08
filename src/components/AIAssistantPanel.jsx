import { useEffect, useRef, useState } from 'react'
import './AIAssistantPanel.css'

const FALLBACK_HINTS = {
  'linear-regression':
    'Look at the vertical gaps between each point and the line. Which change to the slope or intercept would make those gaps smaller overall?',
  'k-means':
    'Pick one point and compare its distance to each centroid. Which centroid is closest, and how would the centroids move once the groups change?',
  'gradient-descent':
    'Look at where the blue dot sits on the error surface. Which direction is downhill from there, and how did the error change after the last step?',
}

const LANGUAGES = [
  { id: 'en', label: 'English', name: 'English', speech: 'en-IN' },
  { id: 'hi', label: 'हिन्दी', name: 'Hindi', speech: 'hi-IN' },
  { id: 'mr', label: 'मराठी', name: 'Marathi', speech: 'mr-IN' },
]
const LANGUAGE_KEY = 'mlx.assistantLanguage'
const NEXT_EXPERIMENT = 'Suggest my next experiment.'

function readLanguage() {
  try {
    const v = sessionStorage.getItem(LANGUAGE_KEY)
    if (LANGUAGES.some((l) => l.id === v)) return v
  } catch {
    // storage unavailable: use the default
  }
  return 'en'
}

const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

// A voice whose language starts with the same two letters, preferring an exact match (such as hi-IN).
function pickVoice(voices, code) {
  const norm = (v) => v.lang.replace('_', '-').toLowerCase()
  const exact = voices.find((v) => norm(v) === code.toLowerCase())
  return exact || voices.find((v) => norm(v).startsWith(code.slice(0, 2).toLowerCase())) || null
}

// Spoken text should not include markdown symbols.
function plainSpeech(text) {
  return text.replace(/[*`_#]/g, '')
}

function AIAssistantPanel({ topic, stateDescription = '', history = [] }) {
  const [language, setLanguage] = useState(readLanguage)
  const [question, setQuestion] = useState('')
  const [reply, setReply] = useState(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [voices, setVoices] = useState(() => (speechSupported ? window.speechSynthesis.getVoices() : []))
  const [speaking, setSpeaking] = useState(false)
  const [speechError, setSpeechError] = useState('')
  const utteranceRef = useRef(null)

  const langInfo = LANGUAGES.find((l) => l.id === language)
  const voice = pickVoice(voices, langInfo.speech)

  // The voice list can arrive after the first render.
  useEffect(() => {
    if (!speechSupported) return undefined
    const synth = window.speechSynthesis
    const update = () => setVoices(synth.getVoices())
    update()
    synth.addEventListener('voiceschanged', update)
    return () => synth.removeEventListener('voiceschanged', update)
  }, [])

  function stopSpeaking() {
    if (!speechSupported) return
    utteranceRef.current = null
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }

  // Never leave speech running after the panel goes away.
  useEffect(
    () => () => {
      if (speechSupported) window.speechSynthesis.cancel()
    },
    [],
  )

  function toggleSpeech() {
    if (speaking) {
      stopSpeaking()
      return
    }
    if (!voice || !reply) return
    setSpeechError('')
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(plainSpeech(reply))
    u.voice = voice
    u.lang = voice.lang
    u.onend = () => {
      if (utteranceRef.current === u) {
        utteranceRef.current = null
        setSpeaking(false)
      }
    }
    u.onerror = (ev) => {
      if (utteranceRef.current !== u) return
      utteranceRef.current = null
      setSpeaking(false)
      if (ev.error !== 'canceled' && ev.error !== 'interrupted') {
        setSpeechError('Sorry, the reply could not be read aloud on this device.')
      }
    }
    utteranceRef.current = u
    setSpeaking(true)
    window.speechSynthesis.speak(u)
  }

  function chooseLanguage(id) {
    stopSpeaking()
    setSpeechError('')
    setLanguage(id)
    try {
      sessionStorage.setItem(LANGUAGE_KEY, id)
    } catch {
      // storage blocked: the choice still applies for this visit
    }
  }

  function ask(e) {
    e.preventDefault()
    send(question.trim())
  }

  async function send(q) {
    if (!q || loading) return
    stopSpeaking()
    setSpeechError('')
    setLoading(true)
    setFailed(false)
    setReply(null)
    try {
      const res = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, stateDescription, question: q, history, language }),
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
      <div className="aiLang" role="group" aria-label="Assistant language">
        {LANGUAGES.map((l) => (
          <button
            key={l.id}
            type="button"
            className={`aiLangBtn${language === l.id ? ' active' : ''}`}
            aria-pressed={language === l.id}
            onClick={() => chooseLanguage(l.id)}
          >
            {l.label}
          </button>
        ))}
      </div>
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
      <button className="aiNext" type="button" disabled={loading} onClick={() => send(NEXT_EXPERIMENT)}>
        Suggest my next experiment
      </button>
      <div className="aiReply" aria-live="polite">
        {loading && <p className="aiLoading">Thinking of a hint…</p>}
        {!loading && failed && (
          <p className="aiError">The assistant is unavailable right now, so here is a general hint instead.</p>
        )}
        {!loading && reply && <p className="aiText">{reply}</p>}
      </div>
      {speechSupported && !loading && reply && (
        <div className="aiSpeech">
          <button
            className="aiListen"
            type="button"
            disabled={!voice && !speaking}
            aria-label={speaking ? 'Stop reading this reply aloud' : 'Listen to this reply'}
            onClick={toggleSpeech}
          >
            {speaking ? 'Stop' : 'Listen'}
          </button>
          {!voice && <span className="aiSpeechNote">No {langInfo.name} voice found on this device</span>}
        </div>
      )}
      <p className="aiSpeechError" role="alert" aria-live="assertive">
        {speechError}
      </p>
    </aside>
  )
}

export default AIAssistantPanel
