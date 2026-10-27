import { useState } from 'react'
import { BOWL_MIN, bowlAt, bowlGrad, bowlJ } from './theoryMath.js'

const W = 420
const H = 270
const PAD = { l: 30, r: 12, t: 14, b: 28 }
const WMIN = -1.5
const WMAX = 7.5
const JMAX = 20
const sx = (w) => PAD.l + ((w - WMIN) / (WMAX - WMIN)) * (W - PAD.l - PAD.r)
const sy = (j) => H - PAD.b - (Math.min(j, JMAX * 1.5) / JMAX) * (H - PAD.t - PAD.b)
const CURVE = Array.from({ length: 91 }, (_, i) => {
  const w = WMIN + (i / 90) * (WMAX - WMIN)
  return `${i === 0 ? 'M' : 'L'}${sx(w).toFixed(1)} ${sy(bowlJ(w)).toFixed(1)}`
}).join(' ')

const CAPTIONS = [
  'Every position has an error. This is a one-parameter slice of the real surface, which has a slope and an intercept.',
  'The gradient points uphill. Gradient descent steps the opposite way.',
  'Update rule: new position = old position − α × gradient. Press Step to apply it once.',
  'The learning rate α is a setting you choose. Try the three presets and compare.',
  'Near the bottom the gradient is almost zero, so steps shrink. We stop when the error stops changing.',
  'Standardising the data makes the bowl round, so one learning rate works in every direction.',
  'There is no formula like OLS for a neural network, so it is trained with exactly this loop.',
]

// Theory blocks 0 to 6 of the gradient descent lesson.
function BowlVisual({ focus }) {
  const [lr, setLr] = useState(0.3)
  const [n, setN] = useState(0)
  const w = bowlAt(lr, n)
  const g = bowlGrad(w)
  const next = w - lr * g
  const trail = Array.from({ length: Math.min(n, 40) + 1 }, (_, i) => bowlAt(lr, i))
  const blowsUp = Math.abs(1 - 2 * lr) > 1
  const bounces = Math.abs(1 - 2 * lr) === 1
  const settled = Math.abs(g) < 0.05
  // A ball that has left the chart is pinned to the top edge and labelled, so the learner still sees what happened.
  const off = !Number.isFinite(w) || bowlJ(w) > JMAX
  const ballX = sx(Math.max(WMIN, Math.min(WMAX, Number.isFinite(w) ? w : 0)))
  const ballY = off ? PAD.t + 12 : sy(bowlJ(w))

  let status = 'Press Step.'
  if (n > 0) {
    if (blowsUp) status = 'Each step overshoots further than the last: diverging.'
    else if (bounces) status = 'It bounces between the same two points and never settles.'
    else if (settled) status = `Converged after ${n} step${n === 1 ? '' : 's'}: the gradient is almost zero.`
    else status = 'Still moving downhill.'
  }

  const arrow = (x1, y1, x2, y2, cls) => (
    <g className={cls}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <polygon points={`${x2},${y2} ${x2 - Math.sign(x2 - x1) * 8},${y2 - 4} ${x2 - Math.sign(x2 - x1) * 8},${y2 + 4}`} />
    </g>
  )

  return (
    <div className="tvBody">
      <svg viewBox={`0 0 ${W} ${H}`} className="tvSvg" role="img" aria-label="A bowl-shaped error curve with a ball rolling towards the bottom">
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} className="tvAxis" />
        <text x={W - PAD.r} y={H - 8} textAnchor="end" className="tvAxisText">one parameter</text>
        <text x={W / 2} y={PAD.t + 8} textAnchor="middle" className="tvAxisText">error J</text>
        <path d={CURVE} className="tvCurve" />
        <text x={sx(BOWL_MIN)} y={H - PAD.b + 16} textAnchor="middle" className="tvAxisText">best</text>
        {trail.slice(0, -1).map((tw, i) => (
          <circle key={i} cx={sx(tw)} cy={sy(bowlJ(tw))} r="3" className="tvTrail" />
        ))}
        {focus >= 1 && !off && arrow(sx(w), sy(bowlJ(w)) - 16, sx(w + Math.sign(g) * 0.9), sy(bowlJ(w)) - 16, 'tvArrow tvArrow--up')}
        {focus >= 2 && !off && Math.abs(next - w) > 0.02 && arrow(sx(w), sy(bowlJ(w)) + 18, sx(Math.max(WMIN, Math.min(WMAX, next))), sy(bowlJ(w)) + 18, 'tvArrow tvArrow--down')}
        <circle cx={ballX} cy={ballY} r="8" className="tvBall" />
        {off && (
          <text x={Math.min(Math.max(ballX, 70), W - 70)} y={ballY + 24} textAnchor="middle" className="tvAxisText tvOff">
            off the chart
          </text>
        )}
      </svg>

      <div className="tvReadouts">
        <button type="button" className="btn btn--primary primaryBtn" onClick={() => setN((v) => v + 1)} disabled={n >= 60}>
          Step
        </button>
        <button type="button" className="btn btn--ghost ghostBtn" onClick={() => setN((v) => Math.min(60, v + 15))}>
          Run 15
        </button>
        <button type="button" className="btn btn--ghost ghostBtn" onClick={() => setN(0)}>
          Reset
        </button>
        <span className="tvCount" aria-hidden="true">step {n}</span>
      </div>

      {focus >= 3 && (
        <div className="tvControls">
          <div className="tvReadouts" role="group" aria-label="Learning rate presets">
            {[0.05, 0.3, 1.1].map((v) => (
              <button key={v} type="button" className={`btn ghostBtn${lr === v ? ' tvOn' : ''}`} aria-pressed={lr === v} onClick={() => { setLr(v); setN(0) }}>
                α = {v}
              </button>
            ))}
          </div>
          <label>
            Learning rate α <b>{lr.toFixed(2)}</b>
            <input type="range" min="0.01" max="1.2" step="0.01" value={lr} onChange={(e) => { setLr(parseFloat(e.target.value)); setN(0) }} aria-label="Learning rate" />
          </label>
        </div>
      )}

      <div className="tvReadouts tvMath">
        <span>position <b>{Math.abs(w) < 1e4 ? w.toFixed(2) : '∞'}</b></span>
        {focus >= 1 && <span>gradient <b>{Math.abs(g) < 1e4 ? g.toFixed(2) : '∞'}</b></span>}
        {focus >= 2 && <span>step α × gradient <b>{Math.abs(lr * g) < 1e4 ? (lr * g).toFixed(2) : '∞'}</b></span>}
        {focus >= 4 && <span className="tvStatus">{status}</span>}
      </div>
      <p className="tvCaption" aria-live="polite">{CAPTIONS[Math.min(focus, CAPTIONS.length - 1)]}</p>
    </div>
  )
}

export default BowlVisual
