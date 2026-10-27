import { useState } from 'react'
import { HOUSING_X, HOUSING_Y } from '../../data/sampleData.js'
import { mseOf, ols } from './theoryMath.js'

const W = 420
const H = 290
const PAD = { l: 34, r: 12, t: 12, b: 28 }
const XMAX = 10
const YMAX = 16
const OUTLIER = [8.5, 13.5]
const sx = (x) => PAD.l + (x / XMAX) * (W - PAD.l - PAD.r)
const sy = (y) => H - PAD.b - (y / YMAX) * (H - PAD.t - PAD.b)
const PIXELS_PER_Y = (H - PAD.t - PAD.b) / YMAX

const CAPTIONS = [
  'Drag the sliders. A prediction is the height of the line above each x: ŷ = b₀ + b₁x.',
  'Each dashed segment is a residual: the real price minus what the line predicts.',
  'Each square is one residual squared. MSE is their average, so one big gap counts for a lot.',
  'Press the button. OLS finds the line with the lowest possible MSE in one calculation.',
  'Add the outlier and watch the best-fit line tilt towards it. One odd point can move the whole line.',
]

// Theory blocks 0 to 4 of the linear regression lesson, shown as one picture you can drag.
function LineVisual({ focus }) {
  const [m, setM] = useState(0.4)
  const [b, setB] = useState(2)
  const [outlier, setOutlier] = useState(false)

  const xs = outlier ? [...HOUSING_X, OUTLIER[0]] : HOUSING_X
  const ys = outlier ? [...HOUSING_Y, OUTLIER[1]] : HOUSING_Y
  const best = ols(xs, ys)
  const bestWithout = ols(HOUSING_X, HOUSING_Y)
  const mse = mseOf(xs, ys, m, b)
  const showLimits = focus === 4
  const lineAt = (mm, bb) => ({ x1: sx(0), y1: sy(bb), x2: sx(XMAX), y2: sy(mm * XMAX + bb) })

  return (
    <div className="tvBody">
      <svg viewBox={`0 0 ${W} ${H}`} className="tvSvg" role="img" aria-label="Scatter plot of area against price with a straight line">
        <line x1={PAD.l} y1={H - PAD.b} x2={W - PAD.r} y2={H - PAD.b} className="tvAxis" />
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={H - PAD.b} className="tvAxis" />
        <text x={W - PAD.r} y={H - 8} textAnchor="end" className="tvAxisText">area (100 sq ft)</text>
        <text x={PAD.l + 4} y={PAD.t + 9} className="tvAxisText">price (lakh)</text>

        {focus === 2 &&
          xs.map((x, i) => {
            const e = Math.abs(m * x + b - ys[i])
            const side = e * PIXELS_PER_Y
            const top = Math.min(sy(m * x + b), sy(ys[i]))
            // Squares grow to the right of the residual, or to the left when they would run off the picture.
            const left = sx(x) + side > W - 4 ? sx(x) - side : sx(x)
            return <rect key={`sq${i}`} x={left} y={top} width={side} height={side} className="tvSquare" />
          })}
        {focus >= 1 && !showLimits &&
          xs.map((x, i) => <line key={`r${i}`} x1={sx(x)} y1={sy(ys[i])} x2={sx(x)} y2={sy(m * x + b)} className="tvResidual" />)}

        {showLimits ? (
          <>
            <line {...lineAt(bestWithout.b1, bestWithout.b0)} className="tvLine tvLine--ref" />
            {outlier && <line {...lineAt(best.b1, best.b0)} className="tvLine tvLine--alt" />}
          </>
        ) : (
          <line {...lineAt(m, b)} className="tvLine" />
        )}

        {xs.map((x, i) => (
          <circle key={i} cx={sx(x)} cy={sy(ys[i])} r={outlier && i === xs.length - 1 ? 6 : 4.5} className={outlier && i === xs.length - 1 ? 'tvDot tvDot--outlier' : 'tvDot'} />
        ))}
      </svg>

      {!showLimits && (
        <div className="tvControls">
          <label>
            Steepness b₁ <b>{m.toFixed(2)}</b>
            <input type="range" min="0" max="2" step="0.05" value={m} onChange={(e) => setM(parseFloat(e.target.value))} aria-label="Steepness (slope)" />
          </label>
          <label>
            Height b₀ <b>{b.toFixed(1)}</b>
            <input type="range" min="-2" max="8" step="0.1" value={b} onChange={(e) => setB(parseFloat(e.target.value))} aria-label="Height (intercept)" />
          </label>
        </div>
      )}

      <div className="tvReadouts">
        {focus >= 2 && !showLimits && (
          <span>
            MSE <b>{mse.toFixed(2)}</b>
          </span>
        )}
        {focus === 3 && (
          <>
            <button
              type="button"
              className="btn btn--primary primaryBtn"
              onClick={() => {
                setM(Math.min(2, Math.max(0, best.b1)))
                setB(Math.min(8, Math.max(-2, best.b0)))
              }}
            >
              Snap to the best line
            </button>
            <span>
              best possible MSE <b>{mseOf(xs, ys, best.b1, best.b0).toFixed(2)}</b>
            </span>
          </>
        )}
        {showLimits && (
          <label className="tvCheck">
            <input type="checkbox" checked={outlier} onChange={(e) => setOutlier(e.target.checked)} /> Add an outlier
          </label>
        )}
        {showLimits && outlier && (
          <span>
            slope moved from <b>{bestWithout.b1.toFixed(2)}</b> to <b>{best.b1.toFixed(2)}</b>
          </span>
        )}
      </div>
      <p className="tvCaption" aria-live="polite">{CAPTIONS[Math.min(focus, CAPTIONS.length - 1)]}</p>
    </div>
  )
}

export default LineVisual
