import { useState } from 'react'
import { RING_POINTS } from '../kmeansDatasets.js'
import { TWO_GROUPS } from '../../data/sampleData.js'
import { assignPoints, converged, lloydAt } from './theoryMath.js'

const W = 420
const H = 290
const PAD = 16
const sx = (x) => PAD + (x / 10) * (W - 2 * PAD)
const sy = (y) => H - PAD - (y / 10) * (H - 2 * PAD)
const COLOURS = ['var(--blue)', 'var(--rust)', 'var(--good)', '#7a4f9a', '#8a8370']
const MARKS = ['circle', 'square', 'triangle', 'diamond']

function Marker({ x, y, shape, fill, size = 5.5 }) {
  if (shape === 'square') return <rect x={x - size} y={y - size} width={size * 2} height={size * 2} fill={fill} className="tvMark" />
  if (shape === 'triangle') return <polygon points={`${x},${y - size - 1} ${x + size + 1},${y + size} ${x - size - 1},${y + size}`} fill={fill} className="tvMark" />
  if (shape === 'diamond') return <polygon points={`${x},${y - size - 1} ${x + size + 1},${y} ${x},${y + size + 1} ${x - size - 1},${y}`} fill={fill} className="tvMark" />
  return <circle cx={x} cy={y} r={size} fill={fill} className="tvMark" />
}

const MODES = ['raw', 'nearest', 'steps', 'steps', 'choose', 'limits']
const CAPTIONS = {
  raw: 'Nothing here is labelled. K-means has to find the groups on its own.',
  nearest: 'A point joins its nearest centre. Slide the blue centre and watch points change sides.',
  steps: 'Step 1: points join the nearest centre. Step 2: each centre moves to the middle of its points. Repeat.',
  choose: 'More clusters always lower the total, so K is a choice you make. Look for where the bars stop dropping fast.',
  limits: 'On two rings K-means cuts the plane in half instead of finding the rings. It assumes round, separate blobs.',
}

// Theory blocks 0 to 5 of the K-means lesson.
function ClusterVisual({ focus }) {
  const mode = MODES[Math.min(focus, MODES.length - 1)]
  const [halfSteps, setHalfSteps] = useState(0)
  const [k, setK] = useState(2)
  const [slide, setSlide] = useState(2)
  const [rings, setRings] = useState(true)

  const points = mode === 'limits' ? (rings ? RING_POINTS : TWO_GROUPS) : TWO_GROUPS
  const kUsed = mode === 'limits' ? 2 : mode === 'nearest' ? 2 : k
  const state = mode === 'steps' ? lloydAt(points, k, halfSteps) : converged(points, kUsed)

  let cents = state.cents
  let labels = state.labels
  if (mode === 'raw') {
    cents = []
    labels = null
  } else if (mode === 'nearest') {
    cents = [[slide, 2.5], [7.5, 7.5]]
    labels = assignPoints(points, cents)
  }
  const sseBars = [1, 2, 3, 4, 5].map((kk) => converged(TWO_GROUPS, kk).sse)
  const maxBar = Math.max(...sseBars)

  return (
    <div className="tvBody">
      <svg viewBox={`0 0 ${W} ${H}`} className="tvSvg" role="img" aria-label="Scatter plot of points being grouped into clusters">
        {mode === 'nearest' &&
          points.map((p, i) => (
            <line key={`l${i}`} x1={sx(p[0])} y1={sy(p[1])} x2={sx(cents[labels[i]][0])} y2={sy(cents[labels[i]][1])} className="tvLink" />
          ))}
        {points.map((p, i) => {
          const label = labels ? labels[i] : null
          return (
            <Marker key={i} x={sx(p[0])} y={sy(p[1])} shape={label === null ? 'circle' : MARKS[label % 4]} fill={label === null ? 'var(--line-strong)' : COLOURS[label % 5]} size={mode === 'limits' && rings ? 4 : 5.5} />
          )
        })}
        {cents.map((c, i) => (
          <g key={`c${i}`}>
            <rect x={sx(c[0]) - 7} y={sy(c[1]) - 7} width="14" height="14" transform={`rotate(45 ${sx(c[0])} ${sy(c[1])})`} fill={COLOURS[i % 5]} className="tvCentre" />
          </g>
        ))}
      </svg>

      {mode === 'nearest' && (
        <div className="tvControls">
          <label>
            Blue centre, left to right <b>{slide.toFixed(1)}</b>
            <input type="range" min="0.5" max="9.5" step="0.1" value={slide} onChange={(e) => setSlide(parseFloat(e.target.value))} aria-label="Move the blue centre" />
          </label>
        </div>
      )}

      {mode === 'steps' && (
        <div className="tvReadouts">
          <button type="button" className="btn btn--primary primaryBtn" onClick={() => setHalfSteps((n) => n + 1)}>
            {state.phase === 'assigned' ? 'Step: move the centres' : 'Step: assign points'}
          </button>
          <button type="button" className="btn btn--ghost ghostBtn" onClick={() => setHalfSteps(0)}>
            Reset
          </button>
          {focus >= 3 && state.sse !== null && (
            <span>
              cost J (SSE) <b>{state.sse.toFixed(1)}</b>
              {state.history.length > 1 && <> after pass {state.history.length}</>}
            </span>
          )}
          <span className="tvCount" aria-hidden="true">
            {halfSteps} step{halfSteps === 1 ? '' : 's'}
          </span>
        </div>
      )}

      {mode === 'choose' && (
        <>
          <div className="tvReadouts" role="group" aria-label="Choose K">
            {[1, 2, 3, 4, 5].map((kk) => (
              <button key={kk} type="button" className={`btn ghostBtn${k === kk ? ' tvOn' : ''}`} aria-pressed={k === kk} onClick={() => setK(kk)}>
                K = {kk}
              </button>
            ))}
          </div>
          <div className="tvBars" role="img" aria-label="Cost J for K from 1 to 5">
            {sseBars.map((v, i) => (
              <div key={i} className={`tvBar${k === i + 1 ? ' tvBar--on' : ''}`}>
                <span style={{ height: `${(v / maxBar) * 100}%` }} />
                <em>{i + 1}</em>
              </div>
            ))}
          </div>
          <p className="tvNote">Cost J for each K: {sseBars.map((v) => v.toFixed(0)).join(', ')}</p>
        </>
      )}

      {mode === 'limits' && (
        <div className="tvReadouts">
          <label className="tvCheck">
            <input type="checkbox" checked={rings} onChange={(e) => setRings(e.target.checked)} /> Use two rings instead of two groups
          </label>
        </div>
      )}
      <p className="tvCaption" aria-live="polite">{CAPTIONS[mode]}</p>
    </div>
  )
}

export default ClusterVisual
