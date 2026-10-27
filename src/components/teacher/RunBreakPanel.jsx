import { useEffect, useRef, useState } from 'react'
import { logEvent } from '../../utils/logger.js'
import { applyBug, RUN_TEMPLATES, runInWorker } from './codeRunner.js'
import './RunBreakPanel.css'

const fmt = (v) => {
  if (typeof v !== 'number') return String(v)
  if (!Number.isFinite(v)) return String(v)
  if (v !== 0 && (Math.abs(v) >= 1e4 || Math.abs(v) < 1e-3)) return v.toExponential(2)
  return v.toFixed(3)
}

const HINTS = {
  timeout: 'Look for a loop whose counter never changes, or a condition that is always true.',
  syntax: 'Check brackets, commas and quotes near the part you changed.',
  runtime: 'A name may be spelt differently from where it was created, or a value is missing.',
  return: 'End the code with return { ... } listing what to show.',
}

// Log-scale line chart: the learner's run against the correct run.
function SeriesChart({ mine, reference, label }) {
  const W = 360
  const H = 150
  const pad = { l: 38, r: 8, t: 8, b: 22 }
  const toLog = (v) => (Number.isFinite(v) ? Math.log10(Math.max(Math.abs(v), 1e-12)) : null)
  const all = [...mine, ...(reference || [])].map(toLog).filter((v) => v !== null)
  const lo = Math.min(...all)
  const hi = Math.max(...all, lo + 0.5)
  const x = (i, n) => pad.l + (n <= 1 ? 0 : (i / (n - 1)) * (W - pad.l - pad.r))
  const y = (v) => {
    const l = toLog(v)
    const t = l === null ? 1 : (l - lo) / (hi - lo)
    return H - pad.b - t * (H - pad.t - pad.b)
  }
  const path = (xs) => xs.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i, xs.length).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  return (
    <figure className="rbChart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
        <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="var(--line-strong)" />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="var(--line-strong)" />
        <text x={pad.l - 4} y={pad.t + 8} textAnchor="end" className="rbAxis">
          {fmt(10 ** hi)}
        </text>
        <text x={pad.l - 4} y={H - pad.b} textAnchor="end" className="rbAxis">
          {fmt(10 ** lo)}
        </text>
        <text x={W - pad.r} y={H - 6} textAnchor="end" className="rbAxis">
          step
        </text>
        {reference && <path d={path(reference)} fill="none" stroke="var(--line-strong)" strokeWidth="2" strokeDasharray="5 4" />}
        <path d={path(mine)} fill="none" stroke="var(--primary)" strokeWidth="2.5" />
      </svg>
      <figcaption>
        {label}. <span className="rbKeyMine">Blue: your code.</span> <span className="rbKeyRef">Dashed grey: the correct code.</span>
      </figcaption>
    </figure>
  )
}

function RunBreakPanel({ algorithmType }) {
  const template = RUN_TEMPLATES[algorithmType] ?? RUN_TEMPLATES['gradient-descent']
  const [code, setCode] = useState(template.code)
  const [outcome, setOutcome] = useState(null) // { ...runner result, ranCode }
  const [reference, setReference] = useState(null)
  const [running, setRunning] = useState(false)
  const [bug, setBug] = useState(null) // { id, code }
  const gutterRef = useRef(null)

  // The correct code runs once, so the learner's chart has something to be compared with.
  useEffect(() => {
    let cancelled = false
    runInWorker(template.code).then((r) => {
      if (!cancelled && r.ok) setReference(r.result[template.series])
    })
    return () => {
      cancelled = true
    }
  }, [template])

  async function run() {
    if (running) return
    setRunning(true)
    setOutcome(null)
    const r = await runInWorker(code)
    setOutcome({ ...r, ranCode: code })
    setRunning(false)
    logEvent('code_run', 'teacher', { alg: algorithmType, ok: r.ok, kind: r.ok ? 'ok' : r.kind, bug: bug && bug.code === code ? bug.id : null })
  }

  function breakIt(id) {
    const next = applyBug(template, id, template.code)
    if (!next) return
    setCode(next)
    setBug({ id, code: next })
    setOutcome(null)
  }

  function resetCode() {
    setCode(template.code)
    setBug(null)
    setOutcome(null)
  }

  const lines = code.split('\n')
  const errorLine = outcome && !outcome.ok && outcome.line ? outcome.line : null
  const activeBug = bug && outcome && outcome.ranCode === bug.code ? template.bugs.find((b) => b.id === bug.id) : null
  const series = outcome?.ok ? outcome.result[template.series] : null
  const diverged = Array.isArray(series) && (series.some((v) => !Number.isFinite(v)) || series[series.length - 1] > series[0] * 2)

  return (
    <div className="rb">
      <p className="rbIntro">
        <b>Run and break it.</b> This is a JavaScript twin of the algorithm. It really runs in your browser on the same data, so
        you can change it, break it on purpose, and read the real error.
      </p>

      <div className="rbToolbar">
        <button type="button" className="tw-code-run-btn" onClick={run} disabled={running}>
          <span>▶</span> {running ? 'Running…' : 'Run code'}
        </button>
        <button type="button" className="tw-code-revert-btn" onClick={resetCode}>
          <span>↺</span> Correct code
        </button>
      </div>

      <div className="rbBreakRow" role="group" aria-label="Break the code on purpose">
        <span className="rbBreakLabel">Break it:</span>
        {template.bugs.map((b) => (
          <button key={b.id} type="button" className={`rbBug${bug?.id === b.id && bug.code === code ? ' active' : ''}`} onClick={() => breakIt(b.id)}>
            {b.label}
          </button>
        ))}
      </div>

      <div className="rbEditor">
        <div className="rbGutter" ref={gutterRef} aria-hidden="true">
          {lines.map((_, i) => (
            <div key={i} className={errorLine === i + 1 ? 'rbGutterErr' : undefined}>
              {i + 1}
            </div>
          ))}
        </div>
        <textarea
          className="rbTextarea"
          aria-label={`${template.title} code, JavaScript`}
          value={code}
          wrap="off"
          spellCheck="false"
          autoCapitalize="off"
          autoComplete="off"
          onChange={(e) => setCode(e.target.value)}
          onScroll={(e) => {
            if (gutterRef.current) gutterRef.current.scrollTop = e.target.scrollTop
          }}
        />
      </div>

      <div className="rbOutput" aria-live="polite">
        {outcome && !outcome.ok && (
          <div className="rbError" role="alert">
            <p>
              <b>{outcome.name}</b>: {outcome.message}
            </p>
            {errorLine && (
              <p className="rbErrorLine">
                Line {errorLine}: <code>{outcome.ranCode.split('\n')[errorLine - 1]?.trim()}</code>
              </p>
            )}
            <p className="rbHint">{HINTS[outcome.kind] || ''}</p>
          </div>
        )}

        {outcome?.ok && (
          <div className={`rbResult${diverged ? ' rbResult--bad' : ''}`}>
            <p className="rbVerdict">
              {diverged
                ? `The loss grew from ${fmt(series[0])} to ${fmt(series[series.length - 1])}. The run diverged.`
                : `The loss fell from ${fmt(series[0])} to ${fmt(series[series.length - 1])} in ${series.length} steps.`}
            </p>
            <ul className="rbValues">
              {Object.entries(outcome.result)
                .filter(([, v]) => typeof v === 'number')
                .map(([k, v]) => (
                  <li key={k}>
                    {k}: <b>{fmt(v)}</b>
                  </li>
                ))}
              {reference && <li>correct code ends at: <b>{fmt(reference[reference.length - 1])}</b></li>}
            </ul>
            <SeriesChart mine={series} reference={reference} label={template.seriesLabel} />
          </div>
        )}

        {activeBug && (
          <div className="rbWhy">
            <b>What happened.</b> {activeBug.explain}
          </div>
        )}
      </div>
    </div>
  )
}

export default RunBreakPanel
