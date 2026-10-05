import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TeacherWorkspaceLayout from './TeacherWorkspaceLayout.jsx'
import TeacherPlaybackControls from './TeacherPlaybackControls.jsx'
import TeacherExplanationPanel from './TeacherExplanationPanel.jsx'
import './TeacherGradientDescent.css'

// Dataset: Housing dataset from Linear Regression
const X = [1, 2, 3, 4, 5, 6, 6.5, 7, 8, 9]
const Y = [2.1, 2.9, 4.2, 4.8, 6.1, 6.9, 7.3, 7.8, 8.6, 9.4]
const N = X.length

const meanX = X.reduce((a, b) => a + b, 0) / N
const meanY = Y.reduce((a, b) => a + b, 0) / N
const stdX = Math.sqrt(X.reduce((s, x) => s + (x - meanX) ** 2, 0) / N)
const stdY = Math.sqrt(Y.reduce((s, y) => s + (y - meanY) ** 2, 0) / N)
const Xn = X.map((x) => (x - meanX) / stdX)
const Yn = Y.map((y) => (y - meanY) / stdY)

// OLS Optimum
const sxy = X.reduce((s, x, i) => s + (x - meanX) * (Y[i] - meanY), 0)
const sxx = X.reduce((s, x) => s + (x - meanX) ** 2, 0)
const OLS_B1 = sxy / sxx
const OLS_B0 = meanY - OLS_B1 * meanX

// Landscape bounds
const B1_MIN = -0.6
const B1_MAX = 3.0
const B0_MIN = -2.0
const B0_MAX = 8.5

function mseReal(b1, b0) {
  let s = 0
  for (let i = 0; i < N; i++) {
    const e = b1 * X[i] + b0 - Y[i]
    s += e * e
  }
  return s / N
}

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

function lerpColor(t) {
  const a = [0xf3, 0xef, 0xe4]
  const b = [0x2f, 0x5d, 0x8a]
  const c = a.map((av, i) => Math.round(av + (b[i] - av) * t))
  return `rgb(${c[0]},${c[1]},${c[2]})`
}

const GRID_X = 46
const GRID_Y = 34
const W = 560
const H = 380
const PAD = { l: 52, r: 24, t: 20, b: 42 }
const plotW = W - PAD.l - PAD.r
const plotH = H - PAD.t - PAD.b
const cellW = plotW / GRID_X
const cellH = plotH / GRID_Y

const px = (b1) => PAD.l + ((b1 - B1_MIN) / (B1_MAX - B1_MIN)) * plotW
const py = (b0) => PAD.t + plotH - ((b0 - B0_MIN) / (B0_MAX - B0_MIN)) * plotH

// Precomputed heatmap background
const HEAT_CELLS = []
for (let i = 0; i < GRID_X; i++) {
  const b1 = B1_MIN + ((i + 0.5) * (B1_MAX - B1_MIN)) / GRID_X
  for (let j = 0; j < GRID_Y; j++) {
    const b0 = B0_MIN + ((j + 0.5) * (B0_MAX - B0_MIN)) / GRID_Y
    const t = Math.min(1, Math.sqrt(mseReal(b1, b0)) / 6)
    HEAT_CELLS.push({
      key: `${i}-${j}`,
      x: PAD.l + i * cellW,
      y: PAD.t + plotH - (j + 1) * cellH,
      fill: lerpColor(t),
    })
  }
}

function starPoints(cx, cy) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 8 : 3.5
    const a = Math.PI / 2 + (i * Math.PI) / 5
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy - r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

const START_POSITIONS = {
  topLeft: { label: 'Far Top-Left (Under-tilted)', b1: -0.3, b0: 6.5 },
  bottomRight: { label: 'Far Bottom-Right (Over-tilted)', b1: 2.3, b0: -0.5 },
  nearMin: { label: 'Near Minimum', b1: 0.5, b0: 2.0 },
}

const LR_PRESETS = [
  { label: 'Small (0.05)', lr: 0.05, desc: 'Slow convergence; tiny timid steps.' },
  { label: 'Appropriate (0.30)', lr: 0.3, desc: 'Rapid, smooth downhill descent.' },
  { label: 'Very Large (0.95)', lr: 0.95, desc: 'Overshooting & oscillation across valley!' },
]

const GD_STEPS = [
  {
    key: 'initial_param',
    label: '1. Initial State',
    title: 'Initial Parameter Coordinates',
    what: 'We place our model parameters (b₁, b₀) at an arbitrary starting location on the error landscape. The error is high.',
    why: 'Optimization begins from an initial guess. The model has no prior knowledge of where the valley bottom lies.',
    talkingPoint:
      'Point out the blue starting circle on the heatmap and the corresponding poorly-fitting line on the mini chart to the right.',
  },
  {
    key: 'calculate_loss',
    label: '2. Compute Loss',
    title: 'Evaluating Loss at Current Position',
    what: 'We compute the Mean Squared Error (MSE) for the current (b₁, b₀). The background color indicates elevation: darker blue represents worse loss.',
    why: 'Loss quantifies how far our current parameter choices are from explaining the data.',
    talkingPoint:
      'Explain the analogy: The loss surface is like a 2D bowl or terrain. Our goal is to roll a ball to the deepest depression at the bottom.',
  },
  {
    key: 'calculate_gradient',
    label: '3. Calculate Gradient',
    title: 'Measuring Slope & Steepest Ascent',
    what: 'We calculate the gradient vector: ∇J = [∂J/∂b₁, ∂J/∂b₀]. The red arrow points in the direction of steepest loss INCREASE.',
    why: 'The gradient mathematically identifies the direction of maximal climb. Therefore, the exact opposite direction (−∇J) is steepest downhill.',
    talkingPoint:
      'Emphasize this core rule: "The gradient points uphill. We must step in the NEGATIVE gradient direction to reduce error."',
  },
  {
    key: 'parameter_update',
    label: '4. Parameter Update',
    title: 'Taking a Step Downhill',
    what: 'Parameters update using: w_new = w_old − α·∇J. The step size is scaled by the learning rate (α). The green arrow shows the actual step taken.',
    why: 'This step guarantees a decrease in loss provided the learning rate is not excessively large.',
    talkingPoint:
      'Notice how the step size combines the steepness of the terrain with our chosen learning rate multiplier.',
  },
  {
    key: 'recalculate_loss',
    label: '5. Recalculate Loss',
    title: 'New Position & Error Drop',
    what: 'At the new coordinates, the line adjusts and the Mean Squared Error drops. The blue marker has shifted into a lighter, lower-error region.',
    why: 'Verifies progress: one iteration of gradient descent has successfully reduced the objective cost.',
    talkingPoint:
      'Compare the new MSE value with step 1. Note how the line on the right rotated closer to the data scatter.',
  },
  {
    key: 'repeat',
    label: '6. Multi-Step Repeat',
    title: 'Iterative Trajectory Downhill',
    what: 'The update repeats across successive iterations. The rust trail plots the exact path taken down the error surface.',
    why: 'Gradient descent navigates complex terrains step-by-step until the slope levels out.',
    talkingPoint:
      'Show how the steps naturally become smaller as the parameter nears the valley floor, because the gradient magnitude shrinks near a flat minimum.',
  },
  {
    key: 'convergence',
    label: '7. Convergence',
    title: 'Convergence at the Minimum',
    what: 'The parameter settles at the gold star (the global minimum). Here the gradient is zero (||∇J|| ≈ 0), matching the OLS best fit.',
    why: 'At the bottom of the bowl, slope is zero. The optimization has converged to the best possible linear model.',
    talkingPoint:
      'Celebrate convergence! Explain that in deep learning, millions of parameters follow this same fundamental descent rule.',
  },
]

function TeacherGradientDescent() {
  const [startKey, setStartKey] = useState('topLeft')
  const [learningRate, setLearningRate] = useState(0.3)

  // Simulation State
  const [stepIndex, setStepIndex] = useState(0)
  const [pos, setPos] = useState(() => [
    START_POSITIONS.topLeft.b1,
    START_POSITIONS.topLeft.b0,
  ])
  const [path, setPath] = useState(() => [
    [START_POSITIONS.topLeft.b1, START_POSITIONS.topLeft.b0],
  ])
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  // Auxiliary toggles
  const [showGradientArrow, setShowGradientArrow] = useState(true)
  const [showPathTrail, setShowPathTrail] = useState(true)
  const [showStarOptimum, setShowStarOptimum] = useState(true)

  // Current Parameters & Loss
  const [b1, b0] = pos
  const currentMSE = useMemo(() => mseReal(b1, b0), [b1, b0])
  const olsMSE = useMemo(() => mseReal(OLS_B1, OLS_B0), [])

  // Gradient at current position
  const [mn, bn] = useMemo(() => normFromReal(b1, b0), [b1, b0])
  const [dm, db] = useMemo(() => gradNorm(mn, bn), [mn, bn])
  const gradMag = Math.hypot(dm, db)

  // Reset to chosen start position
  const resetToStart = useCallback(
    (newStartKey = startKey) => {
      const cfg = START_POSITIONS[newStartKey]
      setStartKey(newStartKey)
      setStepIndex(0)
      setPos([cfg.b1, cfg.b0])
      setPath([[cfg.b1, cfg.b0]])
      setIsPlaying(false)
    },
    [startKey],
  )

  // Perform single GD step
  const stepDescent = useCallback(
    (currentB1, currentB0, curPath) => {
      const [curMn, curBn] = normFromReal(currentB1, currentB0)
      const [curDm, curDb] = gradNorm(curMn, curBn)
      const nextMn = curMn - learningRate * curDm
      const nextBn = curBn - learningRate * curDb
      const [nextB1, nextB0] = realFromNorm(nextMn, nextBn)
      const clampedB1 = Math.max(B1_MIN + 0.1, Math.min(B1_MAX - 0.1, nextB1))
      const clampedB0 = Math.max(B0_MIN + 0.1, Math.min(B0_MAX - 0.1, nextB0))
      return {
        nextB1: clampedB1,
        nextB0: clampedB0,
        nextPath: [...curPath, [clampedB1, clampedB0]],
      }
    },
    [learningRate],
  )

  // Jump to specific step
  const handleJumpStep = useCallback(
    (targetIdx) => {
      setStepIndex(targetIdx)
      const cfg = START_POSITIONS[startKey]

      if (targetIdx <= 2) {
        setPos([cfg.b1, cfg.b0])
        setPath([[cfg.b1, cfg.b0]])
      } else if (targetIdx === 3 || targetIdx === 4) {
        const { nextB1, nextB0, nextPath } = stepDescent(cfg.b1, cfg.b0, [[cfg.b1, cfg.b0]])
        setPos([nextB1, nextB0])
        setPath(nextPath)
      } else if (targetIdx === 5) {
        let curB1 = cfg.b1
        let curB0 = cfg.b0
        let p = [[curB1, curB0]]
        for (let i = 0; i < 4; i++) {
          const res = stepDescent(curB1, curB0, p)
          curB1 = res.nextB1
          curB0 = res.nextB0
          p = res.nextPath
        }
        setPos([curB1, curB0])
        setPath(p)
      } else if (targetIdx === 6) {
        if (learningRate >= 0.9) {
          // In overshoot mode, show the oscillating path!
          let curB1 = cfg.b1
          let curB0 = cfg.b0
          let p = [[curB1, curB0]]
          for (let i = 0; i < 8; i++) {
            const res = stepDescent(curB1, curB0, p)
            curB1 = res.nextB1
            curB0 = res.nextB0
            p = res.nextPath
          }
          setPos([curB1, curB0])
          setPath(p)
        } else {
          // Converged
          let curB1 = cfg.b1
          let curB0 = cfg.b0
          let p = [[curB1, curB0]]
          for (let i = 0; i < 12; i++) {
            const res = stepDescent(curB1, curB0, p)
            curB1 = res.nextB1
            curB0 = res.nextB0
            p = res.nextPath
            if (Math.hypot(res.nextB1 - OLS_B1, res.nextB0 - OLS_B0) < 0.05) break
          }
          setPos([Number(OLS_B1.toFixed(3)), Number(OLS_B0.toFixed(3))])
          setPath([...p, [OLS_B1, OLS_B0]])
        }
      }
    },
    [startKey, learningRate, stepDescent],
  )

  const handleNext = useCallback(() => {
    if (stepIndex < GD_STEPS.length - 1) {
      handleJumpStep(stepIndex + 1)
    } else {
      setIsPlaying(false)
    }
  }, [stepIndex, handleJumpStep])

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) {
      handleJumpStep(stepIndex - 1)
    }
  }, [stepIndex, handleJumpStep])

  // Autoplay
  const timerRef = useRef(null)
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
      return undefined
    }

    const intervalMs = Math.round(1800 / speed)
    timerRef.current = setInterval(() => {
      setStepIndex((cur) => {
        if (cur >= GD_STEPS.length - 1) {
          setIsPlaying(false)
          return cur
        }
        const next = cur + 1
        handleJumpStep(next)
        return next
      })
    }, intervalMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, speed, handleJumpStep])

  const curStep = GD_STEPS[stepIndex]

  // Detect overshooting
  const isOvershooting = learningRate >= 0.9

  // Dynamic Metrics for Explanation Panel
  const panelMetrics = [
    { label: 'Slope (b₁)', value: b1.toFixed(3) },
    { label: 'Intercept (b₀)', value: b0.toFixed(3) },
    {
      label: 'Loss (MSE)',
      value: currentMSE.toFixed(3),
      status: currentMSE - olsMSE < 0.05 ? 'good' : 'rust',
    },
    { label: 'Learning Rate (α)', value: learningRate.toFixed(2) },
    { label: 'Gradient Norm', value: gradMag.toFixed(2) },
    {
      label: 'Optimal OLS MSE',
      value: olsMSE.toFixed(3),
    },
  ]

  // Controls Elements
  const controlsElement = (
    <>
      <div className="tw-ctrl-group">
        <span className="tw-ctrl-label">Starting Point:</span>
        <select
          className="tw-select"
          value={startKey}
          onChange={(e) => resetToStart(e.target.value)}
        >
          {Object.entries(START_POSITIONS).map(([key, item]) => (
            <option key={key} value={key}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="tw-divider" />

      {/* Learning Rate Demonstration Presets (Section 15) */}
      <div className="tw-ctrl-group">
        <span className="tw-ctrl-label">Learning Rate Demo:</span>
        <div className="tw-lr-presets-bar">
          {LR_PRESETS.map((p) => (
            <button
              key={p.lr}
              type="button"
              className={`tw-lr-preset-btn ${learningRate === p.lr ? 'active' : ''}`}
              onClick={() => {
                setLearningRate(p.lr)
                resetToStart(startKey)
              }}
              title={p.desc}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="tw-divider" />

      <div className="tw-ctrl-group">
        <span className="tw-ctrl-label">α Slider:</span>
        <input
          type="range"
          min="0.02"
          max="1.1"
          step="0.02"
          value={learningRate}
          onChange={(e) => {
            setLearningRate(Number(e.target.value))
            resetToStart(startKey)
          }}
          style={{ width: 100, accentColor: 'var(--blue)' }}
        />
        <b>{learningRate.toFixed(2)}</b>
      </div>
    </>
  )

  // Gradient vector coordinates for arrow
  // Step 2 & 3 show gradient arrows
  const arrowScale = 22
  const gradArrowX = px(b1) + dm * arrowScale
  const gradArrowY = py(b0) - db * arrowScale
  const updateArrowX = px(b1) - dm * arrowScale * learningRate * 2.5
  const updateArrowY = py(b0) + db * arrowScale * learningRate * 2.5

  // Mini Chart mapping functions
  const MINI = { W: 240, H: 200, l: 30, r: 12, t: 14, b: 28 }
  const miniPw = MINI.W - MINI.l - MINI.r
  const miniPh = MINI.H - MINI.t - MINI.b
  const mx = (x) => MINI.l + (x / 10) * miniPw
  const my = (y) => MINI.t + miniPh - (y / 11) * miniPh

  // Visualization Area
  const visualizationElement = (
    <div className="tw-gd-vis-layout">
      {/* 2D Error Surface Heatmap */}
      <div>
        <div className="tw-vis-card-header" style={{ marginBottom: 8 }}>
          <div className="tw-vis-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Error Surface: J(b₁, b₀)
            {isOvershooting && (
              <span className="tw-overshoot-badge">⚠️ Overshooting Active</span>
            )}
          </div>
          <div className="tw-vis-toggles">
            <label className="tw-checkbox-label">
              <input
                type="checkbox"
                checked={showGradientArrow}
                onChange={(e) => setShowGradientArrow(e.target.checked)}
              />
              Gradient Vector
            </label>
            <label className="tw-checkbox-label">
              <input
                type="checkbox"
                checked={showPathTrail}
                onChange={(e) => setShowPathTrail(e.target.checked)}
              />
              Descent Path
            </label>
            <label className="tw-checkbox-label">
              <input
                type="checkbox"
                checked={showStarOptimum}
                onChange={(e) => setShowStarOptimum(e.target.checked)}
              />
              Target Minimum ★
            </label>
          </div>
        </div>

        <svg
          className="tw-gd-surface-svg"
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label="2D error landscape heatmap with gradient descent position and vectors"
        >
          <defs>
            <marker
              id="arrow-grad"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="var(--rust)" />
            </marker>
            <marker
              id="arrow-update"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="var(--good)" />
            </marker>
          </defs>

          {/* Error Heatmap Cells */}
          {HEAT_CELLS.map((c) => (
            <rect
              key={c.key}
              x={c.x.toFixed(1)}
              y={c.y.toFixed(1)}
              width={(cellW + 0.6).toFixed(1)}
              height={(cellH + 0.6).toFixed(1)}
              fill={c.fill}
            />
          ))}

          {/* Axes */}
          <line
            x1={px(B1_MIN)}
            y1={py(B0_MIN)}
            x2={px(B1_MAX)}
            y2={py(B0_MIN)}
            stroke="var(--ink)"
            strokeWidth="1"
            opacity="0.4"
          />
          <line
            x1={px(B1_MIN)}
            y1={py(B0_MIN)}
            x2={px(B1_MIN)}
            y2={py(B0_MAX)}
            stroke="var(--ink)"
            strokeWidth="1"
            opacity="0.4"
          />

          <text className="tw-lr-label" x={PAD.l + plotW / 2} y={H - 10} textAnchor="middle">
            Slope (b₁)
          </text>
          <text
            className="tw-lr-label"
            x={16}
            y={PAD.t + plotH / 2}
            textAnchor="middle"
            transform={`rotate(-90 16 ${PAD.t + plotH / 2})`}
          >
            Intercept (b₀)
          </text>

          {/* Trajectory Path */}
          {showPathTrail && path.length > 1 && (
            <>
              <polyline
                points={path.map(([pb1, pb0]) => `${px(pb1)},${py(pb0)}`).join(' ')}
                fill="none"
                stroke="var(--rust)"
                strokeWidth="2.2"
                strokeDasharray={isOvershooting ? '4 2' : 'none'}
              />
              {path.map(([pb1, pb0], i) => (
                <circle
                  key={i}
                  cx={px(pb1)}
                  cy={py(pb0)}
                  r={3}
                  fill="var(--rust)"
                />
              ))}
            </>
          )}

          {/* Starting Position Ring */}
          <circle
            cx={px(START_POSITIONS[startKey].b1)}
            cy={py(START_POSITIONS[startKey].b0)}
            r={6}
            fill="none"
            stroke="var(--ink)"
            strokeWidth="1.5"
          />

          {/* Global Optimum Target Star */}
          {showStarOptimum && (
            <polygon
              points={starPoints(px(OLS_B1), py(OLS_B0))}
              fill="#D9B44A"
              stroke="var(--ink)"
              strokeWidth="0.8"
            />
          )}

          {/* Gradient Vectors (Step 2 and 3) */}
          {showGradientArrow && stepIndex >= 2 && (
            <>
              {/* Steepest Ascent Arrow (Gradient) */}
              <line
                x1={px(b1)}
                y1={py(b0)}
                x2={gradArrowX}
                y2={gradArrowY}
                stroke="var(--rust)"
                strokeWidth="2"
                markerEnd="url(#arrow-grad)"
              />
              {/* Steepest Descent Step (-alpha * grad) */}
              <line
                x1={px(b1)}
                y1={py(b0)}
                x2={updateArrowX}
                y2={updateArrowY}
                stroke="var(--good)"
                strokeWidth="2.5"
                markerEnd="url(#arrow-update)"
              />
            </>
          )}

          {/* Current Parameter Marker */}
          <circle
            cx={px(b1)}
            cy={py(b0)}
            r={7}
            fill="var(--blue)"
            stroke="#fff"
            strokeWidth="2"
          />
        </svg>

        {/* Legend */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, fontSize: '11px', color: 'var(--muted)' }}>
          <span>Terrain Elevation: Light = Low MSE (Valley), Dark = High MSE</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ color: 'var(--rust)' }}>➔ Gradient (Uphill)</span>
            <span style={{ color: 'var(--good)' }}>➔ Update Step (Downhill)</span>
          </div>
        </div>
      </div>

      {/* Mini Fit View: How parameter manifests as line */}
      <div className="tw-gd-mini-card">
        <h4 className="tw-gd-mini-title">Physical Model Fit</h4>
        <div style={{ fontSize: '11.5px', color: 'var(--muted)' }}>
          Current Line: <code>ŷ = {b1.toFixed(2)}x + {b0.toFixed(2)}</code>
        </div>
        <svg
          className="tw-gd-mini-svg"
          viewBox={`0 0 ${MINI.W} ${MINI.H}`}
          role="img"
          aria-label="Scatter plot and current linear regression fit line"
        >
          <line x1={mx(0)} y1={my(0)} x2={mx(10)} y2={my(0)} stroke="#C9C1A8" />
          <line x1={mx(0)} y1={my(0)} x2={mx(0)} y2={my(11)} stroke="#C9C1A8" />
          {X.map((xVal, i) => (
            <circle key={i} cx={mx(xVal)} cy={my(Y[i])} r={3.5} fill="var(--ink)" />
          ))}
          {/* Target OLS line */}
          <line
            x1={mx(0)}
            y1={my(OLS_B0)}
            x2={mx(10)}
            y2={my(OLS_B1 * 10 + OLS_B0)}
            stroke="var(--good)"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
          {/* Current Line */}
          <line
            x1={mx(0)}
            y1={my(b0)}
            x2={mx(10)}
            y2={my(b1 * 10 + b0)}
            stroke="var(--blue)"
            strokeWidth="2.2"
          />
        </svg>

        <div style={{ fontSize: '11px', color: 'var(--muted)', lineHeight: 1.4 }}>
          Green dashed = OLS Target<br />
          Solid Blue = Current Gradient Descent Hypothesis
        </div>
      </div>
    </div>
  )

  return (
    <TeacherWorkspaceLayout
      title="Gradient Descent"
      subtitle="Demonstrate how an optimisation algorithm iteratively updates model parameters to minimise a loss function."
      controls={controlsElement}
      visualization={visualizationElement}
      explanationPanel={
        <TeacherExplanationPanel
          stepNumber={stepIndex + 1}
          totalSteps={GD_STEPS.length}
          stepTitle={curStep.title}
          whatIsHappening={curStep.what}
          whyItMatters={curStep.why}
          metrics={panelMetrics}
          talkingPoint={curStep.talkingPoint}
        />
      }
      playbackControls={
        <TeacherPlaybackControls
          currentStep={stepIndex}
          totalSteps={GD_STEPS.length}
          stepLabels={GD_STEPS.map((s) => s.label)}
          isPlaying={isPlaying}
          speed={speed}
          canPrev={stepIndex > 0}
          canNext={stepIndex < GD_STEPS.length - 1}
          onReset={() => resetToStart()}
          onPrev={handlePrev}
          onNext={handleNext}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onJumpStep={handleJumpStep}
          onSpeedChange={setSpeed}
        />
      }
    />
  )
}

export default TeacherGradientDescent
