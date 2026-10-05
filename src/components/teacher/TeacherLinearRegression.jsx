import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TeacherWorkspaceLayout from './TeacherWorkspaceLayout.jsx'
import TeacherPlaybackControls from './TeacherPlaybackControls.jsx'
import TeacherExplanationPanel from './TeacherExplanationPanel.jsx'
import './TeacherLinearRegression.css'

// Preset Datasets
const DATASETS = {
  standard: {
    id: 'standard',
    name: 'Housing Prices (Standard 10 points)',
    points: [
      { x: 1, y: 2.1 },
      { x: 2, y: 2.9 },
      { x: 3, y: 4.2 },
      { x: 4, y: 4.8 },
      { x: 5, y: 6.1 },
      { x: 6, y: 6.9 },
      { x: 6.5, y: 7.3 },
      { x: 7, y: 7.8 },
      { x: 8, y: 8.6 },
      { x: 9, y: 9.4 },
    ],
    xLabel: 'Area (100 sq ft)',
    yLabel: 'Price (₹ lakh)',
    xRange: [0, 10],
    yRange: [0, 11],
    initB1: 0.35,
    initB0: 1.5,
  },
  steep: {
    id: 'steep',
    name: 'Steep Growth Trend',
    points: [
      { x: 1, y: 1.5 },
      { x: 2, y: 3.2 },
      { x: 3, y: 4.9 },
      { x: 4, y: 6.8 },
      { x: 5, y: 8.5 },
      { x: 6, y: 10.2 },
      { x: 7, y: 12.1 },
      { x: 8, y: 13.9 },
    ],
    xLabel: 'Study Time (hours)',
    yLabel: 'Score (%)',
    xRange: [0, 9],
    yRange: [0, 16],
    initB1: 0.8,
    initB0: 1.0,
  },
  noisy: {
    id: 'noisy',
    name: 'High Variance (Noisy Data)',
    points: [
      { x: 1, y: 3.0 },
      { x: 2, y: 1.8 },
      { x: 3, y: 5.5 },
      { x: 4, y: 3.9 },
      { x: 5, y: 7.2 },
      { x: 6, y: 5.4 },
      { x: 7, y: 8.9 },
      { x: 8, y: 7.1 },
      { x: 9, y: 10.5 },
    ],
    xLabel: 'Marketing Spend ($k)',
    yLabel: 'Sales Volume ($k)',
    xRange: [0, 10],
    yRange: [0, 12],
    initB1: 0.4,
    initB0: 2.0,
  },
  outlier: {
    id: 'outlier',
    name: 'Dataset with Outlier (Sensitivity Demo)',
    points: [
      { x: 1, y: 2.0 },
      { x: 2, y: 2.8 },
      { x: 3, y: 3.9 },
      { x: 4, y: 9.8 }, // Outlier!
      { x: 5, y: 5.8 },
      { x: 6, y: 6.7 },
      { x: 7, y: 7.6 },
      { x: 8, y: 8.4 },
      { x: 9, y: 9.3 },
    ],
    xLabel: 'Square Footage (100s)',
    yLabel: 'Price (₹ lakh)',
    xRange: [0, 10],
    yRange: [0, 12],
    initB1: 0.5,
    initB0: 1.5,
  },
}

function computeOLS(points) {
  const n = points.length
  const xbar = points.reduce((a, p) => a + p.x, 0) / n
  const ybar = points.reduce((a, p) => a + p.y, 0) / n
  let sxy = 0
  let sxx = 0
  for (const p of points) {
    sxy += (p.x - xbar) * (p.y - ybar)
    sxx += (p.x - xbar) ** 2
  }
  const b1 = sxx !== 0 ? sxy / sxx : 1
  const b0 = ybar - b1 * xbar
  return { b1, b0, xbar, ybar }
}

function computeMSE(points, b1, b0) {
  let s = 0
  for (const p of points) {
    const e = b1 * p.x + b0 - p.y
    s += e * e
  }
  return s / points.length
}

function computeGradients(points, b1, b0) {
  let db1 = 0
  let db0 = 0
  const n = points.length
  for (const p of points) {
    const err = b1 * p.x + b0 - p.y
    db1 += err * p.x
    db0 += err
  }
  return {
    gradB1: (2 * db1) / n,
    gradB0: (2 * db0) / n,
  }
}

const LR_STEPS = [
  {
    key: 'dataset',
    label: '1. Dataset',
    title: 'Input Dataset & Problem Formulation',
    what: 'We observe a collection of paired data points (X, Y). Each point represents an input feature and its observed target outcome.',
    why: 'Supervised learning begins with empirical observations. The goal is to discover an underlying mathematical relationship so we can make predictions on unseen inputs.',
    talkingPoint:
      'Ask the class: Looking at these points, does Y generally increase as X increases? Could a straight line capture this pattern?',
  },
  {
    key: 'initial_model',
    label: '2. Initial Model',
    title: 'Initial Hypothesis Line',
    what: 'We define a linear candidate model: ŷ = b₁·x + b₀. The initial slope (b₁) and intercept (b₀) are chosen heuristically or randomly and do not fit well yet.',
    why: 'Learning is an iterative search process. We start with a baseline hypothesis and evaluate how well or poorly it performs before modifying it.',
    talkingPoint:
      'Point out that the initial line misses most points. Discuss: How should we mathematically measure the imperfection of this line?',
  },
  {
    key: 'predictions',
    label: '3. Predictions',
    title: 'Model Predictions (ŷ)',
    what: 'For every sample input xᵢ, the model computes a predicted value ŷᵢ = b₁·xᵢ + b₀. These predictions lie directly on the line.',
    why: 'Predictions represent what the current model believes the output should be. Comparing predictions to actual values will reveal errors.',
    talkingPoint:
      'Notice the blue prediction dots on the line. For each flat area, compare where the model guesses vs where the real data point sits.',
  },
  {
    key: 'residuals',
    label: '4. Error (Residuals)',
    title: 'Residuals: Actual vs. Predicted',
    what: 'For each data point, the residual is the signed difference: eᵢ = yᵢ − ŷᵢ. Points above the line have positive residuals; points below have negative residuals.',
    why: 'Residuals provide the granular feedback signal needed to adjust the model. A perfect model would have zero residuals for all points.',
    talkingPoint:
      'Direct student attention to the vertical dashed lines. If we merely summed raw residuals, positive and negative errors would cancel out! How do we prevent that?',
  },
  {
    key: 'loss',
    label: '5. Loss (MSE)',
    title: 'Loss Function: Mean Squared Error',
    what: 'We square each residual and compute their average: MSE = (1/n) · Σ (yᵢ − ŷᵢ)². This aggregates all individual errors into a single non-negative cost score.',
    why: 'Squaring turns all errors positive and penalizes larger errors much more heavily than small ones. The model’s objective is to minimize this loss score.',
    talkingPoint:
      'Look at the squared error areas. Notice that points far from the line create massive area boxes, heavily penalizing poor fits.',
  },
  {
    key: 'gradient',
    label: '6. Parameter Update',
    title: 'Computing Gradients for Updates',
    what: 'Calculus gives the direction of steepest error increase (the gradient). We compute ∂MSE/∂b₁ and ∂MSE/∂b₀, and adjust parameters in the opposite direction.',
    why: 'Without gradient directions, parameter tuning would be pure guesswork. Gradients mathematically tell the model whether to tilt up/down and shift up/down.',
    talkingPoint:
      'Emphasize the negative sign in the update: w_new = w_old - learning_rate * gradient. We want to decrease loss, so we move opposite to the gradient.',
  },
  {
    key: 'new_model',
    label: '7. New Model',
    title: 'Updated Regression Line',
    what: 'Parameters are updated with the computed step. The regression line rotates and translates closer to the points, immediately reducing the Mean Squared Error.',
    why: 'Demonstrates the core loop of machine learning: evaluating feedback and producing an improved model state.',
    talkingPoint:
      'Observe how the line tilted and the vertical residual bars shortened. The MSE number dropped significantly.',
  },
  {
    key: 'repeat',
    label: '8. Repeat',
    title: 'Iterative Optimization Loop',
    what: 'The process repeats across successive iterations: Predict → Compute Error → Measure Gradients → Update Parameters. Each step refines the fit.',
    why: 'Real machine learning models train over tens or thousands of iterations until parameters stabilize.',
    talkingPoint:
      'Explain to students: As the line gets closer to the optimal position, the gradients shrink naturally because the residuals are smaller.',
  },
  {
    key: 'convergence',
    label: '9. Convergence',
    title: 'Convergence to Optimal Line',
    what: 'The model reaches the optimal parameters where the gradient is zero (∂MSE/∂b = 0). The line matches the Ordinary Least Squares (OLS) closed-form solution.',
    why: 'At convergence, no slight adjustment to slope or intercept can further reduce the Mean Squared Error. The learning goal is accomplished.',
    talkingPoint:
      'Celebrate convergence! Compare this final gradient-descent line with the analytical OLS green target line—they coincide perfectly.',
  },
]

function TeacherLinearRegression() {
  const [datasetId, setDatasetId] = useState('standard')
  const ds = DATASETS[datasetId]
  const ols = useMemo(() => computeOLS(ds.points), [ds.points])

  // Simulation State
  const [stepIndex, setStepIndex] = useState(0)
  const [b1, setB1] = useState(ds.initB1)
  const [b0, setB0] = useState(ds.initB0)
  const [iteration, setIteration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  // Auxiliary toggles
  const [showResiduals, setShowResiduals] = useState(true)
  const [showPredictions, setShowPredictions] = useState(true)
  const [showSquareBoxes, setShowSquareBoxes] = useState(false)
  const [showOlsTarget, setShowOlsTarget] = useState(false)

  // Reset when dataset changes
  const resetToDataset = useCallback((newDsId) => {
    const targetDs = DATASETS[newDsId]
    setDatasetId(newDsId)
    setStepIndex(0)
    setB1(targetDs.initB1)
    setB0(targetDs.initB0)
    setIteration(0)
    setIsPlaying(false)
  }, [])

  // Current Metrics
  const currentMSE = useMemo(() => computeMSE(ds.points, b1, b0), [ds.points, b1, b0])
  const olsMSE = useMemo(() => computeMSE(ds.points, ols.b1, ols.b0), [ds.points, ols])
  const grads = useMemo(() => computeGradients(ds.points, b1, b0), [ds.points, b1, b0])

  // Execute parameter step
  const applyLearningStep = useCallback(
    (customB1, customB0) => {
      const curB1 = customB1 ?? b1
      const curB0 = customB0 ?? b0
      // Animate closer to OLS
      const alpha = 0.35
      const newB1 = curB1 + (ols.b1 - curB1) * alpha
      const newB0 = curB0 + (ols.b0 - curB0) * alpha
      setB1(Number(newB1.toFixed(3)))
      setB0(Number(newB0.toFixed(3)))
      setIteration((it) => it + 1)
    },
    [b1, b0, ols],
  )

  // Jump to specific conceptual step
  const handleJumpStep = useCallback(
    (targetIdx) => {
      setStepIndex(targetIdx)
      if (targetIdx === 0) {
        setB1(ds.initB1)
        setB0(ds.initB0)
        setIteration(0)
      } else if (targetIdx === 1 || targetIdx === 2 || targetIdx === 3 || targetIdx === 4) {
        setB1(ds.initB1)
        setB0(ds.initB0)
        setIteration(0)
      } else if (targetIdx === 6 || targetIdx === 7) {
        applyLearningStep(ds.initB1, ds.initB0)
      } else if (targetIdx === 8) {
        setB1(Number(ols.b1.toFixed(3)))
        setB0(Number(ols.b0.toFixed(3)))
        setIteration(5)
      }
    },
    [ds, ols, applyLearningStep],
  )

  // Step Forward
  const handleNext = useCallback(() => {
    if (stepIndex < LR_STEPS.length - 1) {
      const nextIdx = stepIndex + 1
      handleJumpStep(nextIdx)
    } else {
      setIsPlaying(false)
    }
  }, [stepIndex, handleJumpStep])

  // Step Backward
  const handlePrev = useCallback(() => {
    if (stepIndex > 0) {
      handleJumpStep(stepIndex - 1)
    }
  }, [stepIndex, handleJumpStep])

  // Reset
  const handleReset = useCallback(() => {
    setIsPlaying(false)
    handleJumpStep(0)
  }, [handleJumpStep])

  // Autoplay effect
  const timerRef = useRef(null)
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
      return undefined
    }

    const intervalMs = Math.round(1800 / speed)
    timerRef.current = setInterval(() => {
      setStepIndex((cur) => {
        if (cur >= LR_STEPS.length - 1) {
          setIsPlaying(false)
          return cur
        }
        const next = cur + 1
        if (next === 6 || next === 7) {
          applyLearningStep()
        } else if (next === 8) {
          setB1(Number(ols.b1.toFixed(3)))
          setB0(Number(ols.b0.toFixed(3)))
          setIteration(5)
        }
        return next
      })
    }, intervalMs)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, speed, applyLearningStep, ols])

  // SVG Scales
  const SVG_W = 600
  const SVG_H = 380
  const PAD = { l: 56, r: 24, t: 24, b: 46 }
  const plotW = SVG_W - PAD.l - PAD.r
  const plotH = SVG_H - PAD.t - PAD.b

  const [xMin, xMax] = ds.xRange
  const [yMin, yMax] = ds.yRange

  const px = useCallback(
    (x) => PAD.l + ((x - xMin) / (xMax - xMin)) * plotW,
    [xMin, xMax, PAD.l, plotW],
  )
  const py = useCallback(
    (y) => PAD.t + plotH - ((y - yMin) / (yMax - yMin)) * plotH,
    [yMin, yMax, PAD.t, plotH],
  )

  // Current Step Meta
  const curStep = LR_STEPS[stepIndex]

  // Dynamic Metrics for Explanation Panel
  const panelMetrics = [
    { label: 'Slope (b₁)', value: b1.toFixed(3) },
    { label: 'Intercept (b₀)', value: b0.toFixed(3) },
    {
      label: 'Loss (MSE)',
      value: currentMSE.toFixed(3),
      status: currentMSE - olsMSE < 0.05 ? 'good' : 'rust',
    },
    { label: 'Iteration', value: iteration },
    { label: 'Optimal OLS MSE', value: olsMSE.toFixed(3) },
    {
      label: 'Gradient norm',
      value: Math.hypot(grads.gradB1, grads.gradB0).toFixed(2),
    },
  ]

  // Controls Bar Elements
  const controlsElement = (
    <>
      <div className="tw-ctrl-group">
        <span className="tw-ctrl-label">Dataset:</span>
        <select
          className="tw-select"
          value={datasetId}
          onChange={(e) => resetToDataset(e.target.value)}
        >
          {Object.values(DATASETS).map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="tw-divider" />

      {/* Manual parameter sliders */}
      <div className="tw-param-sliders">
        <div className="tw-slider-col">
          <span className="tw-ctrl-label">Slope (b₁):</span>
          <input
            type="range"
            min="-0.5"
            max="2.5"
            step="0.05"
            value={b1}
            onChange={(e) => {
              setB1(Number(e.target.value))
              if (stepIndex === 0) setStepIndex(1)
            }}
          />
          <b>{b1.toFixed(2)}</b>
        </div>
        <div className="tw-slider-col">
          <span className="tw-ctrl-label">Intercept (b₀):</span>
          <input
            type="range"
            min="-1"
            max="6"
            step="0.1"
            value={b0}
            onChange={(e) => {
              setB0(Number(e.target.value))
              if (stepIndex === 0) setStepIndex(1)
            }}
          />
          <b>{b0.toFixed(1)}</b>
        </div>
      </div>
    </>
  )

  // Step 1 hides the line to focus strictly on data
  const isLineVisible = stepIndex > 0
  const isPredVisible = showPredictions && stepIndex >= 2
  const isResidVisible = showResiduals && stepIndex >= 3

  // Visualization Area
  const visualizationElement = (
    <>
      <div className="tw-vis-card-header">
        <div className="tw-vis-title">
          Model: <code>ŷ = {b1.toFixed(2)}x + {b0.toFixed(2)}</code>
        </div>
        <div className="tw-vis-toggles">
          <label className="tw-checkbox-label">
            <input
              type="checkbox"
              checked={showResiduals}
              onChange={(e) => setShowResiduals(e.target.checked)}
            />
            Residuals (eᵢ)
          </label>
          <label className="tw-checkbox-label">
            <input
              type="checkbox"
              checked={showPredictions}
              onChange={(e) => setShowPredictions(e.target.checked)}
            />
            Predictions (ŷᵢ)
          </label>
          <label className="tw-checkbox-label">
            <input
              type="checkbox"
              checked={showSquareBoxes}
              onChange={(e) => setShowSquareBoxes(e.target.checked)}
            />
            Error Squares
          </label>
          <label className="tw-checkbox-label">
            <input
              type="checkbox"
              checked={showOlsTarget}
              onChange={(e) => setShowOlsTarget(e.target.checked)}
            />
            OLS Target Line
          </label>
        </div>
      </div>

      <svg
        className="tw-lr-svg"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        role="img"
        aria-label="Linear regression scatter plot and line fit"
      >
        {/* Grid lines */}
        <g className="tw-lr-grid">
          {Array.from({ length: 6 }).map((_, i) => {
            const xVal = xMin + (i * (xMax - xMin)) / 5
            return (
              <line key={`gx-${i}`} x1={px(xVal)} y1={py(yMin)} x2={px(xVal)} y2={py(yMax)} />
            )
          })}
          {Array.from({ length: 6 }).map((_, i) => {
            const yVal = yMin + (i * (yMax - yMin)) / 5
            return (
              <line key={`gy-${i}`} x1={px(xMin)} y1={py(yVal)} x2={px(xMax)} y2={py(yVal)} />
            )
          })}
        </g>

        {/* Axes */}
        <line
          className="tw-lr-axis"
          x1={px(xMin)}
          y1={py(yMin)}
          x2={px(xMax)}
          y2={py(yMin)}
        />
        <line
          className="tw-lr-axis"
          x1={px(xMin)}
          y1={py(yMin)}
          x2={px(xMin)}
          y2={py(yMax)}
        />

        {/* Ticks and Labels */}
        {Array.from({ length: 6 }).map((_, i) => {
          const xVal = xMin + (i * (xMax - xMin)) / 5
          return (
            <text
              key={`tx-${i}`}
              className="tw-lr-label"
              x={px(xVal)}
              y={py(yMin) + 18}
              textAnchor="middle"
            >
              {xVal.toFixed(0)}
            </text>
          )
        })}
        {Array.from({ length: 6 }).map((_, i) => {
          const yVal = yMin + (i * (yMax - yMin)) / 5
          return (
            <text
              key={`ty-${i}`}
              className="tw-lr-label"
              x={px(xMin) - 10}
              y={py(yVal) + 4}
              textAnchor="end"
            >
              {yVal.toFixed(0)}
            </text>
          )
        })}

        {/* Axis Titles */}
        <text
          className="tw-lr-label"
          x={PAD.l + plotW / 2}
          y={SVG_H - 10}
          textAnchor="middle"
          style={{ fontWeight: 600, fill: 'var(--ink)' }}
        >
          {ds.xLabel}
        </text>
        <text
          className="tw-lr-label"
          x={14}
          y={PAD.t + plotH / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${PAD.t + plotH / 2})`}
          style={{ fontWeight: 600, fill: 'var(--ink)' }}
        >
          {ds.yLabel}
        </text>

        {/* Squared Error Area Boxes */}
        {isLineVisible &&
          showSquareBoxes &&
          ds.points.map((p, i) => {
            const yHat = b1 * p.x + b0
            const side = Math.abs(py(p.y) - py(yHat))
            const boxX = px(p.x)
            const boxY = Math.min(py(p.y), py(yHat))
            return (
              <rect
                key={`sq-${i}`}
                className="tw-lr-residual-box"
                x={boxX}
                y={boxY}
                width={side}
                height={side}
              />
            )
          })}

        {/* Target OLS line (optional comparison) */}
        {showOlsTarget && (
          <line
            className="tw-lr-ols-line"
            x1={px(xMin)}
            y1={py(ols.b1 * xMin + ols.b0)}
            x2={px(xMax)}
            y2={py(ols.b1 * xMax + ols.b0)}
          />
        )}

        {/* Candidate Regression Line */}
        {isLineVisible && (
          <line
            className="tw-lr-line"
            x1={px(xMin)}
            y1={py(b1 * xMin + b0)}
            x2={px(xMax)}
            y2={py(b1 * xMax + b0)}
          />
        )}

        {/* Residual lines (Actual to Predicted) */}
        {isLineVisible &&
          isResidVisible &&
          ds.points.map((p, i) => {
            const yHat = b1 * p.x + b0
            return (
              <line
                key={`res-${i}`}
                className="tw-lr-residual"
                x1={px(p.x)}
                y1={py(p.y)}
                x2={px(p.x)}
                y2={py(yHat)}
              />
            )
          })}

        {/* Prediction Dots on Line */}
        {isLineVisible &&
          isPredVisible &&
          ds.points.map((p, i) => {
            const yHat = b1 * p.x + b0
            return (
              <circle
                key={`pred-${i}`}
                className="tw-lr-pred-point"
                cx={px(p.x)}
                cy={py(yHat)}
                r={4}
              />
            )
          })}

        {/* Actual Observed Data Points */}
        {ds.points.map((p, i) => (
          <circle
            key={`pt-${i}`}
            className="tw-lr-point"
            cx={px(p.x)}
            cy={py(p.y)}
            r={5}
          >
            <title>{`(${p.x}, ${p.y})`}</title>
          </circle>
        ))}

        {/* Step 9 Convergence Celebration Star */}
        {stepIndex === 8 && (
          <g transform={`translate(${px(ols.xbar)}, ${py(ols.ybar) - 26})`}>
            <rect
              x="-60"
              y="-14"
              width="120"
              height="24"
              rx="12"
              fill="var(--good)"
              opacity="0.9"
            />
            <text
              x="0"
              y="3"
              fill="#fff"
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
            >
              ★ Optimal Fit Reached
            </text>
          </g>
        )}
      </svg>
    </>
  )

  return (
    <TeacherWorkspaceLayout
      title="Linear Regression"
      subtitle="Demonstrate how a regression model learns the relationship between input and output values and how the line of best fit changes based on the data."
      controls={controlsElement}
      visualization={visualizationElement}
      explanationPanel={
        <TeacherExplanationPanel
          stepNumber={stepIndex + 1}
          totalSteps={LR_STEPS.length}
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
          totalSteps={LR_STEPS.length}
          stepLabels={LR_STEPS.map((s) => s.label)}
          isPlaying={isPlaying}
          speed={speed}
          canPrev={stepIndex > 0}
          canNext={stepIndex < LR_STEPS.length - 1}
          onReset={handleReset}
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

export default TeacherLinearRegression
