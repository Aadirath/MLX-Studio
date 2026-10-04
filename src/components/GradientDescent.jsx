import { useEffect, useMemo, useState } from 'react'
import './GradientDescent.css'

// Same dataset as the Linear Regression lesson: area (100 sq ft) vs. price (₹ lakh)
const X = [1, 2, 3, 4, 5, 6, 6.5, 7, 8, 9]
const Y = [2.1, 2.9, 4.2, 4.8, 6.1, 6.9, 7.3, 7.8, 8.6, 9.4]
const N = X.length

const meanX = X.reduce((a, b) => a + b, 0) / N
const meanY = Y.reduce((a, b) => a + b, 0) / N
const stdX = Math.sqrt(X.reduce((s, x) => s + (x - meanX) ** 2, 0) / N)
const stdY = Math.sqrt(Y.reduce((s, y) => s + (y - meanY) ** 2, 0) / N)
const Xn = X.map((x) => (x - meanX) / stdX)
const Yn = Y.map((y) => (y - meanY) / stdY)

const B1_MIN = -0.5
const B1_MAX = 3
const B0_MIN = -2
const B0_MAX = 8
const START_B1 = -0.3
const START_B0 = 6.5
const MAX_STEPS = 10
const LR = 0.3
const TICK_MS = 650
const INTRO = 'Press "Step forward" to begin. The starting point is deliberately far from the minimum.'

// OLS optimum, for the star marker
const sxy = X.reduce((s, x, i) => s + (x - meanX) * (Y[i] - meanY), 0)
const sxx = X.reduce((s, x) => s + (x - meanX) ** 2, 0)
const OLS_B1 = sxy / sxx
const OLS_B0 = meanY - OLS_B1 * meanX

const W = 560
const H = 400
const PAD = { l: 50, r: 20, t: 14, b: 36 }
const plotW = W - PAD.l - PAD.r
const plotH = H - PAD.t - PAD.b
const px = (b1) => PAD.l + ((b1 - B1_MIN) / (B1_MAX - B1_MIN)) * plotW
const py = (b0) => PAD.t + plotH - ((b0 - B0_MIN) / (B0_MAX - B0_MIN)) * plotH

function mseReal(b1, b0) {
  let s = 0
  for (let i = 0; i < N; i++) {
    const e = b1 * X[i] + b0 - Y[i]
    s += e * e
  }
  return s / N
}

// Descent runs on standardised data; these convert to and from the real coordinates we display.
function realFromNorm(mn, bn) {
  const b1 = (mn * stdY) / stdX
  const b0 = meanY - b1 * meanX + bn * stdY
  return [b1, b0]
}

function normFromReal(b1, b0) {
  const mn = (b1 * stdX) / stdY
  const bn = (b0 - meanY + b1 * meanX) / stdY
  return [mn, bn]
}

function gradNorm(mn, bn) {
  let dm = 0
  let db = 0
  for (let i = 0; i < N; i++) {
    const e = mn * Xn[i] + bn - Yn[i]
    dm += e * Xn[i]
    db += e
  }
  return [(2 * dm) / N, (2 * db) / N]
}

// paper (#F3EFE4) -> blue (#2F5D8A)
function lerpColor(t) {
  const a = [0xf3, 0xef, 0xe4]
  const b = [0x2f, 0x5d, 0x8a]
  const c = a.map((av, i) => Math.round(av + (b[i] - av) * t))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

const GRID_X = 44
const GRID_Y = 32
const cellW = plotW / GRID_X
const cellH = plotH / GRID_Y

// Precomputed once: the error surface never changes.
const HEAT_CELLS = []
for (let i = 0; i < GRID_X; i++) {
  const b1 = B1_MIN + ((i + 0.5) * (B1_MAX - B1_MIN)) / GRID_X
  for (let j = 0; j < GRID_Y; j++) {
    const b0 = B0_MIN + ((j + 0.5) * (B0_MAX - B0_MIN)) / GRID_Y
    // clamp so the far corners don't wash out the bowl's detail
    const t = Math.min(1, Math.sqrt(mseReal(b1, b0)) / 6)
    HEAT_CELLS.push({
      key: `${i}-${j}`,
      x: PAD.l + i * cellW,
      y: PAD.t + plotH - (j + 1) * cellH,
      fill: lerpColor(t),
    })
  }
}

function initState() {
  const [mn, bn] = normFromReal(START_B1, START_B0)
  return { mn, bn, step: 0, path: [[START_B1, START_B0]], done: false, note: INTRO }
}

function advance(s) {
  const [prevB1, prevB0] = realFromNorm(s.mn, s.bn)
  const prevMse = mseReal(prevB1, prevB0)
  const [dm, db] = gradNorm(s.mn, s.bn)
  const mn = s.mn - LR * dm
  const bn = s.bn - LR * db
  const step = s.step + 1
  const [b1, b0] = realFromNorm(mn, bn)
  const newMse = mseReal(b1, b0)
  const done = step >= MAX_STEPS || Math.abs(newMse - prevMse) < 0.0005
  const dir = b1 > prevB1 ? 'increased' : 'decreased'
  let note = `Moved to the steepest downhill direction from here. Slope ${dir} to ${b1.toFixed(2)}, intercept to ${b0.toFixed(2)}. Error fell from ${prevMse.toFixed(3)} to ${newMse.toFixed(3)}.`
  if (done) note += ' This has reached the bottom of the bowl, the same answer OLS computes directly in one step.'
  return { mn, bn, step, path: [...s.path, [b1, b0]], done, note }
}

function starPoints(cx, cy) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 7 : 3
    const a = Math.PI / 2 + (i * Math.PI) / 5
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy - r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

function ErrorSurface({ b1, b0, path }) {
  const pts = path.map(([pb1, pb0]) => `${px(pb1).toFixed(1)},${py(pb0).toFixed(1)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Heatmap of error across slope and intercept values, with the gradient descent path overlaid">
      {HEAT_CELLS.map((c) => (
        <rect key={c.key} x={c.x.toFixed(1)} y={c.y.toFixed(1)} width={(cellW + 0.6).toFixed(1)} height={(cellH + 0.6).toFixed(1)} fill={c.fill} />
      ))}
      <line x1={px(B1_MIN)} y1={py(B0_MIN)} x2={px(B1_MAX)} y2={py(B0_MIN)} stroke="var(--ink)" strokeWidth="1" opacity="0.4" />
      <line x1={px(B1_MIN)} y1={py(B0_MIN)} x2={px(B1_MIN)} y2={py(B0_MAX)} stroke="var(--ink)" strokeWidth="1" opacity="0.4" />
      <text className="axLbl" x={PAD.l + plotW / 2} y="396" textAnchor="middle">
        Slope (b₁)
      </text>
      <text className="axLbl" x="16" y={PAD.t + plotH / 2} textAnchor="middle" transform={`rotate(-90 16 ${PAD.t + plotH / 2})`}>
        Intercept (b₀)
      </text>
      {path.length > 1 && (
        <>
          <polyline points={pts} fill="none" stroke="var(--rust)" strokeWidth="2" />
          {path.map(([pb1, pb0], i) => (
            <circle key={i} cx={px(pb1).toFixed(1)} cy={py(pb0).toFixed(1)} r="3" fill="var(--rust)" />
          ))}
        </>
      )}
      <circle cx={px(START_B1)} cy={py(START_B0)} r="5" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
      <polygon points={starPoints(px(OLS_B1), py(OLS_B0))} fill="#D9B44A" stroke="var(--ink)" strokeWidth="0.5" />
      <circle cx={px(b1).toFixed(1)} cy={py(b0).toFixed(1)} r="6" fill="var(--blue)" stroke="#fff" strokeWidth="1.5" />
    </svg>
  )
}

const MINI = { W: 220, H: 180, l: 24, r: 10, t: 10, b: 22 }

function MiniFit({ b1, b0 }) {
  const pw = MINI.W - MINI.l - MINI.r
  const ph = MINI.H - MINI.t - MINI.b
  const mx = (x) => MINI.l + (x / 10) * pw
  const my = (y) => MINI.t + ph - (y / 11) * ph
  return (
    <svg viewBox={`0 0 ${MINI.W} ${MINI.H}`} role="img" aria-label="The current line plotted against the housing data">
      <line x1={mx(0)} y1={my(0)} x2={mx(0)} y2={my(11)} stroke="#C9C1A8" />
      <line x1={mx(0)} y1={my(0)} x2={mx(10)} y2={my(0)} stroke="#C9C1A8" />
      {X.map((x, i) => (
        <circle key={i} cx={mx(x)} cy={my(Y[i])} r="3" fill="var(--ink)" />
      ))}
      <line x1={mx(0)} y1={my(b0)} x2={mx(10)} y2={my(b1 * 10 + b0)} stroke="var(--blue)" strokeWidth="2" />
    </svg>
  )
}

function GradientDescent({ onStateDescription } = {}) {
  const [state, setState] = useState(initState)
  const [running, setRunning] = useState(false)

  const [b1, b0] = useMemo(() => realFromNorm(state.mn, state.bn), [state.mn, state.bn])
  const m = mseReal(b1, b0)

  useEffect(() => {
    onStateDescription?.(
      `Step ${state.step}. Slope ${b1.toFixed(2)}, intercept ${b0.toFixed(2)}, error ${m.toFixed(3)}. ${state.done ? 'Converged at the bottom of the bowl.' : 'Not yet converged.'}`,
    )
  }, [state.step, state.done, b1, b0, m, onStateDescription])

  useEffect(() => {
    if (!running) return undefined
    if (state.done) {
      setRunning(false)
      return undefined
    }
    const id = setTimeout(() => setState(advance), TICK_MS)
    return () => clearTimeout(id)
  }, [running, state])

  const handleStep = () => setState(advance)
  const handleRun = () => {
    setState(advance)
    setRunning(true)
  }
  const handleReset = () => {
    setRunning(false)
    setState(initState())
  }

  return (
    <div className="gd">
      <div className="gd-controls">
        <div className="btnCol">
          <button className="btnP" onClick={handleStep} disabled={state.done || running}>
            Step forward
          </button>
          <button className="btnG" onClick={handleRun} disabled={state.done || running}>
            {running ? 'Running…' : 'Run to convergence'}
          </button>
          <button className="btnG" onClick={handleReset}>
            Reset to step 0
          </button>
        </div>
        <p className="note">Each step moves in the steepest downhill direction on this surface, the same idea as rolling a ball down a hill.</p>
        <div>
          <div className="note" style={{ marginBottom: 6 }}>
            Error (darker = worse)
          </div>
          <div className="legendBar" />
          <div className="legendLabels">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
      </div>

      <div className="gd-main">
        <div className="chartRow">
          <span className="chartTitle">Error surface: every possible slope × intercept</span>
          <div className="readouts">
            <span>
              Step <b>{state.step}</b>
            </span>
            <span>
              Error (MSE) <b className="mseVal">{m.toFixed(3)}</b>
            </span>
          </div>
        </div>
        <ErrorSurface b1={b1} b0={b0} path={state.path} />
        <div className="annotation">
          {state.step > 0 && <span className="tag">Step {state.step}</span>}
          {state.note}
        </div>
      </div>

      <div className="gd-side">
        <h3>What this line looks like</h3>
        <MiniFit b1={b1} b0={b0} />
        <p className="note" style={{ marginTop: 8 }}>
          ŷ = {b0.toFixed(2)} + {b1.toFixed(2)}x
        </p>
      </div>
    </div>
  )
}

export default GradientDescent
