import { useEffect, useRef, useState } from 'react'
import './KMeans.css'

const POINTS = [
  [2, 2],
  [3, 2],
  [2, 3],
  [3, 3],
  [1.5, 2.5],
  [2.5, 1.5],
  [3.5, 2.8],
  [2, 3.6],
  [7, 7],
  [8, 7],
  [7, 8],
  [8, 8],
  [6.5, 7.5],
  [7.5, 6.2],
  [8.3, 7.6],
  [7, 6.3],
]

const START_CENTROIDS = [
  [1.5, 1.5],
  [3.8, 3.5],
]

const MAX_ITERS = 6
const CONVERGENCE_EPS = 0.01
const RUN_DELAY_MS = 700
const COLORS = ['var(--blue)', 'var(--rust)']

function dist(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

function makeScale(xMin, xMax, yMin, yMax, padL, padR, padT, padB, W, H) {
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  return {
    px: (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW,
    py: (y) => padT + plotH - ((y - yMin) / (yMax - yMin)) * plotH,
  }
}

const SCALE = makeScale(0, 10, 0, 10, 44, 16, 14, 36, 560, 340)

const INITIAL_SIM = {
  centroids: START_CENTROIDS.map((c) => c.slice()),
  assign: POINTS.map(() => null),
  iter: 0,
  converged: false,
}
const INITIAL_ANNOTATION = {
  html: 'Press "Step forward" to begin. Both starting centroids are placed close together on purpose.',
}

function computeStep(sim) {
  const c0 = sim.centroids[0].slice()
  const c1 = sim.centroids[1].slice()
  const newAssign = POINTS.map((p) => (dist(p, c0) < dist(p, c1) ? 0 : 1))
  const g0 = POINTS.filter((p, i) => newAssign[i] === 0)
  const g1 = POINTS.filter((p, i) => newAssign[i] === 1)
  const mean = (g) =>
    g.length ? [g.reduce((a, p) => a + p[0], 0) / g.length, g.reduce((a, p) => a + p[1], 0) / g.length] : null
  const nc0 = mean(g0) || c0
  const nc1 = mean(g1) || c1
  const moved = dist(nc0, c0) + dist(nc1, c1)
  const nextIter = sim.iter + 1
  const converged = moved < CONVERGENCE_EPS || nextIter >= MAX_ITERS

  let html = `<span class="tag">Iteration ${nextIter}</span>Points reassigned to the nearest centroid (${g0.length} to the first, ${g1.length} to the second). Centroids moved to reflect their new group averages.`
  if (converged) html += ' Centroids stopped moving. That is convergence.'

  return {
    sim: { centroids: [nc0, nc1], assign: newAssign, iter: nextIter, converged },
    annotation: { html },
  }
}

function KMeans({ onStepsChange } = {}) {
  const [sim, setSim] = useState(INITIAL_SIM)
  const [running, setRunning] = useState(false)
  const [annotation, setAnnotation] = useState(INITIAL_ANNOTATION)

  const simRef = useRef(sim)
  const timerRef = useRef(null)

  useEffect(() => {
    simRef.current = sim
  }, [sim])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  useEffect(() => {
    onStepsChange?.(sim.iter)
  }, [sim.iter, onStepsChange])

  function doStep() {
    const result = computeStep(simRef.current)
    simRef.current = result.sim
    setSim(result.sim)
    setAnnotation(result.annotation)
    return result.sim.converged
  }

  function handleRun() {
    if (running || simRef.current.converged) return
    setRunning(true)
    const tick = () => {
      const done = doStep()
      if (!done) {
        timerRef.current = setTimeout(tick, RUN_DELAY_MS)
      } else {
        setRunning(false)
      }
    }
    tick()
  }

  function handleReset() {
    clearTimeout(timerRef.current)
    simRef.current = INITIAL_SIM
    setSim(INITIAL_SIM)
    setRunning(false)
    setAnnotation(INITIAL_ANNOTATION)
  }

  return (
    <div className="kmeans">
      <div className="kmeans-controls">
        <p className="note">Dataset: preset, fixed for this prototype.</p>
        <div className="btnCol">
          <button className="btnP" onClick={doStep} disabled={sim.converged || running}>
            Step forward
          </button>
          <button className="btnG" onClick={handleRun} disabled={sim.converged || running}>
            {running ? 'Running…' : 'Run to convergence'}
          </button>
          <button className="btnG" onClick={handleReset}>
            Reset to step 0
          </button>
        </div>
      </div>

      <div className="kmeans-main">
        <div className="chartRow">
          <span className="chartTitle">16 points, 2 clusters</span>
          <div className="readouts">
            <span>
              Iteration <b>{sim.iter}</b>
            </span>
          </div>
        </div>

        <svg viewBox="0 0 560 340" role="img" aria-label="Interactive k-means clustering chart">
          <line x1={SCALE.px(0)} y1={SCALE.py(0)} x2={SCALE.px(0)} y2={SCALE.py(10)} stroke="#C9C1A8" />
          <line x1={SCALE.px(0)} y1={SCALE.py(0)} x2={SCALE.px(10)} y2={SCALE.py(0)} stroke="#C9C1A8" />
          <text className="axLbl" x={SCALE.px(5)} y="332" textAnchor="middle">
            x
          </text>
          <text
            className="axLbl"
            x="12"
            y={SCALE.py(5)}
            textAnchor="middle"
            transform={`rotate(-90 12 ${SCALE.py(5)})`}
          >
            y
          </text>

          {POINTS.map((p, i) => {
            const cIdx = sim.assign[i]
            const color = cIdx === null ? '#9C9584' : COLORS[cIdx]
            return <circle key={`point-${i}`} cx={SCALE.px(p[0])} cy={SCALE.py(p[1])} r="5" fill={color} />
          })}

          {sim.centroids.map((c, i) => (
            <rect
              key={`centroid-${i}`}
              x={SCALE.px(c[0]) - 6}
              y={SCALE.py(c[1]) - 6}
              width="12"
              height="12"
              fill="none"
              stroke={COLORS[i]}
              strokeWidth="2.5"
              transform={`rotate(45 ${SCALE.px(c[0])} ${SCALE.py(c[1])})`}
            />
          ))}
        </svg>

        <div className="annotation" dangerouslySetInnerHTML={{ __html: annotation.html }} />
      </div>
    </div>
  )
}

export default KMeans
