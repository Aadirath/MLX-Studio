import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import TeacherWorkspaceLayout from './TeacherWorkspaceLayout.jsx'
import TeacherDatasetSelector from './TeacherDatasetSelector.jsx'
import TeacherPlaybackControls from './TeacherPlaybackControls.jsx'
import TeacherExplanationPanel from './TeacherExplanationPanel.jsx'
import './TeacherLinearRegression.css'

// Sample Presets
const SAMPLE_PRESETS = [
  {
    id: 'housing',
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
  },
  {
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
  },
  {
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
  },
  {
    id: 'outlier',
    name: 'Dataset with Outlier (Sensitivity Demo)',
    points: [
      { x: 1, y: 2.0 },
      { x: 2, y: 2.8 },
      { x: 3, y: 3.9 },
      { x: 4, y: 9.8 }, // Outlier point!
      { x: 5, y: 5.8 },
      { x: 6, y: 6.7 },
      { x: 7, y: 7.6 },
      { x: 8, y: 8.4 },
      { x: 9, y: 9.3 },
    ],
    xLabel: 'Square Footage (100s)',
    yLabel: 'Price (₹ lakh)',
  },
]

function computeOLS(points) {
  if (!points || points.length === 0) return { b1: 1, b0: 0, xbar: 0, ybar: 0 }
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
  if (!points || points.length === 0) return 0
  let s = 0
  for (const p of points) {
    const e = b1 * p.x + b0 - p.y
    s += e * e
  }
  return s / points.length
}

const LR_STEPS = [
  {
    key: 'dataset',
    title: 'Dataset & Scatter Plot',
    short: 'Observed empirical points (X, Y)',
    what: 'We observe a collection of paired data points (X, Y). Each point represents an input feature and its observed target outcome.',
    why: 'Supervised learning starts with empirical observations to find an underlying function for predicting unseen inputs.',
    talkingPoint: 'Looking at these points, does Y generally increase as X increases? Can a straight line model this relationship?',
  },
  {
    key: 'initial_model',
    title: 'Initial Model',
    short: 'Baseline hypothesis line: ŷ = b₁·x + b₀',
    what: 'We define an initial linear hypothesis. The starting parameters (slope and intercept) are arbitrary and not yet optimal.',
    why: 'Learning begins from a baseline hypothesis before iterative minimization adjusts it.',
    talkingPoint: 'Notice how the initial line misses most points. How should we measure its error?',
  },
  {
    key: 'predictions',
    title: 'Predictions',
    short: 'Projected values (ŷᵢ) along the line',
    what: 'For every input xᵢ, the model calculates ŷᵢ = b₁·xᵢ + b₀. These predictions lie directly on the line.',
    why: 'Predictions represent what the model estimates the outcome should be.',
    talkingPoint: 'Look at the blue prediction dots along the line comparing model estimates with actual values.',
  },
  {
    key: 'residuals',
    title: 'Residuals (Error)',
    short: 'Vertical gaps: eᵢ = yᵢ − ŷᵢ',
    what: 'The residual is the signed difference: eᵢ = yᵢ − ŷᵢ. Vertical lines connect ground truth to predictions.',
    why: 'Residuals provide the granular feedback signal needed to guide parameter updates.',
    talkingPoint: 'Notice both positive and negative residuals. If we just added them up, they would cancel out!',
  },
  {
    key: 'loss',
    title: 'Loss (MSE)',
    short: 'Mean Squared Error aggregated across all points',
    what: 'We square each residual and compute their average: MSE = (1/n) · Σ (yᵢ − ŷᵢ)². This penalizes large errors heavily.',
    why: 'Squaring eliminates cancellation and punishes outliers with large squared error area boxes.',
    talkingPoint: 'Notice how points far from the line create massive area boxes, dominating the total loss score.',
  },
  {
    key: 'update',
    title: 'Gradient Update',
    short: 'Adjusting slope and intercept against the gradient',
    what: 'Calculus gives the direction of steepest error increase. We adjust parameters in the opposite direction.',
    why: 'Mathematical gradients eliminate guesswork, telling the model which way to rotate and shift.',
    talkingPoint: 'Parameter updates follow: w_new = w_old − learning_rate × gradient.',
  },
  {
    key: 'new_model',
    title: 'Updated Model',
    short: 'Line shifts closer to points; MSE decreases',
    what: 'Parameters adjust. The line rotates and translates closer to the points, immediately reducing MSE.',
    why: 'Demonstrates the fundamental feedback loop of machine learning.',
    talkingPoint: 'Observe how the line tilts closer and the vertical error bars shrink.',
  },
  {
    key: 'repeat',
    title: 'Iterative Refinement',
    short: 'Successive descent steps refining parameters',
    what: 'Predict → Compute Error → Measure Gradients → Update Parameters. Each step refines the fit.',
    why: 'Iterative descent reliably steps downhill towards minimal error.',
    talkingPoint: 'As the line gets closer to optimal, the residuals shrink and gradients naturally become smaller.',
  },
  {
    key: 'convergence',
    title: 'Convergence',
    short: 'Optimal fit reached; gradient is zero',
    what: 'The parameters reach the minimum error where the gradient is zero. The line matches analytical Ordinary Least Squares (OLS).',
    why: 'At convergence, no slight adjustment to slope or intercept can further reduce the error.',
    talkingPoint: 'Compare this line with the analytical green OLS line—they coincide perfectly.',
  },
]

function TeacherLinearRegression() {
  // Dataset State (Preset or Custom CSV)
  const [selectedPresetId, setSelectedPresetId] = useState('housing')
  const [isCustomCsv, setIsCustomCsv] = useState(false)
  const [csvData, setCsvData] = useState(null)
  const [colX, setColX] = useState('')
  const [colY, setColY] = useState('')

  // Active Points & Labels
  const activeData = useMemo(() => {
    if (isCustomCsv && csvData && colX && colY) {
      const validPoints = []
      csvData.rows.forEach((row) => {
        const x = Number(row[colX])
        const y = Number(row[colY])
        if (Number.isFinite(x) && Number.isFinite(y)) {
          validPoints.push({ x, y })
        }
      })
      return {
        points: validPoints,
        xLabel: colX,
        yLabel: colY,
      }
    }
    const preset = SAMPLE_PRESETS.find((p) => p.id === selectedPresetId) || SAMPLE_PRESETS[0]
    return {
      points: preset.points,
      xLabel: preset.xLabel,
      yLabel: preset.yLabel,
    }
  }, [isCustomCsv, csvData, colX, colY, selectedPresetId])

  const ols = useMemo(() => computeOLS(activeData.points), [activeData.points])

  // Simulation State
  const [stepIndex, setStepIndex] = useState(0)
  const [b1, setB1] = useState(() => Number((ols.b1 * 0.4).toFixed(2)))
  const [b0, setB0] = useState(() => Number((ols.b0 * 0.6).toFixed(1)))
  const [iteration, setIteration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)

  // Auxiliary toggles
  const [showResiduals, setShowResiduals] = useState(true)
  const [showPredictions, setShowPredictions] = useState(true)
  const [showSquareBoxes, setShowSquareBoxes] = useState(false)
  const [showOlsTarget, setShowOlsTarget] = useState(false)

  // Initialize line when dataset/OLS changes
  const resetModelToInit = useCallback(() => {
    const initSlope = Number((ols.b1 * 0.4).toFixed(2))
    const initIntercept = Number((ols.b0 * 0.6).toFixed(1))
    setB1(initSlope)
    setB0(initIntercept)
    setStepIndex(0)
    setIteration(0)
    setIsPlaying(false)
  }, [ols])

  // CSV Load Handler
  const handleCsvLoaded = (parsedResult) => {
    setCsvData(parsedResult)
    setIsCustomCsv(true)
    const numCols = parsedResult.numericColumns
    const c1 = numCols[0] || parsedResult.headers[0]
    const c2 = numCols[1] || numCols[0] || parsedResult.headers[1]
    setColX(c1)
    setColY(c2)
    resetModelToInit()
  }

  const handleResetToSample = () => {
    setIsCustomCsv(false)
    setCsvData(null)
    setSelectedPresetId('housing')
    resetModelToInit()
  }

  // Metrics
  const currentMSE = useMemo(() => computeMSE(activeData.points, b1, b0), [activeData.points, b1, b0])
  const olsMSE = useMemo(() => computeMSE(activeData.points, ols.b1, ols.b0), [activeData.points, ols])

  // Single step transition
  const handleJumpStep = useCallback(
    (targetIdx) => {
      setStepIndex(targetIdx)
      if (targetIdx <= 4) {
        setB1(Number((ols.b1 * 0.4).toFixed(2)))
        setB0(Number((ols.b0 * 0.6).toFixed(1)))
        setIteration(0)
      } else if (targetIdx === 5 || targetIdx === 6) {
        const alpha = 0.4
        const newB1 = b1 + (ols.b1 - b1) * alpha
        const newB0 = b0 + (ols.b0 - b0) * alpha
        setB1(Number(newB1.toFixed(3)))
        setB0(Number(newB0.toFixed(3)))
        setIteration(1)
      } else if (targetIdx === 7) {
        const alpha = 0.75
        const newB1 = b1 + (ols.b1 - b1) * alpha
        const newB0 = b0 + (ols.b0 - b0) * alpha
        setB1(Number(newB1.toFixed(3)))
        setB0(Number(newB0.toFixed(3)))
        setIteration(3)
      } else if (targetIdx === 8) {
        setB1(Number(ols.b1.toFixed(3)))
        setB0(Number(ols.b0.toFixed(3)))
        setIteration(5)
      }
    },
    [b1, b0, ols],
  )

  const handleNext = () => {
    if (stepIndex < LR_STEPS.length - 1) {
      handleJumpStep(stepIndex + 1)
    } else {
      setIsPlaying(false)
    }
  }

  const handlePrev = () => {
    if (stepIndex > 0) {
      handleJumpStep(stepIndex - 1)
    }
  }

  // Autoplay
  const timerRef = useRef(null)
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current)
      return undefined
    }
    const intervalMs = Math.round(1600 / speed)
    timerRef.current = setInterval(() => {
      setStepIndex((cur) => {
        if (cur >= LR_STEPS.length - 1) {
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

  // Dynamic Scale Range
  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    const pts = activeData.points
    if (pts.length === 0) return { xMin: 0, xMax: 10, yMin: 0, yMax: 10 }
    const xs = pts.map((p) => p.x)
    const ys = pts.map((p) => p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    const padX = (maxX - minX) * 0.12 || 1
    const padY = (maxY - minY) * 0.12 || 1
    return {
      xMin: minX - padX,
      xMax: maxX + padX,
      yMin: minY - padY,
      yMax: maxY + padY,
    }
  }, [activeData.points])

  const SVG_W = 680
  const SVG_H = 360
  const PAD = { l: 56, r: 24, t: 20, b: 44 }
  const plotW = SVG_W - PAD.l - PAD.r
  const plotH = SVG_H - PAD.t - PAD.b

  const px = useCallback(
    (x) => PAD.l + ((x - xMin) / (xMax - xMin)) * plotW,
    [xMin, xMax, PAD.l, plotW],
  )
  const py = useCallback(
    (y) => PAD.t + plotH - ((y - yMin) / (yMax - yMin)) * plotH,
    [yMin, yMax, PAD.t, plotH],
  )

  const curStep = LR_STEPS[stepIndex]
  const isLineVisible = stepIndex > 0
  const isPredVisible = showPredictions && stepIndex >= 2
  const isResidVisible = showResiduals && stepIndex >= 3

  return (
    <TeacherWorkspaceLayout
      title="Linear Regression Playground"
      subtitle="Demonstrate how a regression model learns the line of best fit. Upload any CSV dataset or use classroom presets."
      datasetSelector={
        <TeacherDatasetSelector
          samplePresets={SAMPLE_PRESETS}
          selectedPresetId={selectedPresetId}
          onSelectPreset={(id) => {
            setSelectedPresetId(id)
            setIsCustomCsv(false)
            resetModelToInit()
          }}
          isCustomCsv={isCustomCsv}
          csvData={csvData}
          onCsvLoaded={handleCsvLoaded}
          onResetToSample={handleResetToSample}
          col1Label="Input (X)"
          col2Label="Target (Y)"
          selectedCol1={colX}
          selectedCol2={colY}
          onCol1Change={setColX}
          onCol2Change={setColY}
        />
      }
      visualization={
        <>
          <div className="tw-vis-card-header">
            <div className="tw-vis-title">
              Model: <code>ŷ = {b1.toFixed(2)}x + {b0.toFixed(2)}</code>
              <span style={{ marginLeft: 12, fontSize: '12px', color: 'var(--muted)', fontWeight: 'normal' }}>
                Loss (MSE): <b>{currentMSE.toFixed(3)}</b>
              </span>
            </div>
            <div className="tw-vis-toggles">
              <label className="tw-checkbox-label">
                <input
                  type="checkbox"
                  checked={showResiduals}
                  onChange={(e) => setShowResiduals(e.target.checked)}
                />
                Residuals
              </label>
              <label className="tw-checkbox-label">
                <input
                  type="checkbox"
                  checked={showPredictions}
                  onChange={(e) => setShowPredictions(e.target.checked)}
                />
                Predictions
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
                Target OLS
              </label>
            </div>
          </div>

          <svg
            className="tw-lr-svg"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            role="img"
            aria-label="Linear regression visualization"
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
            <line className="tw-lr-axis" x1={px(xMin)} y1={py(yMin)} x2={px(xMax)} y2={py(yMin)} />
            <line className="tw-lr-axis" x1={px(xMin)} y1={py(yMin)} x2={px(xMin)} y2={py(yMax)} />

            {/* Axis labels */}
            <text className="tw-lr-label" x={PAD.l + plotW / 2} y={SVG_H - 10} textAnchor="middle" style={{ fontWeight: 600 }}>
              {activeData.xLabel}
            </text>
            <text className="tw-lr-label" x={14} y={PAD.t + plotH / 2} textAnchor="middle" transform={`rotate(-90 14 ${PAD.t + plotH / 2})`} style={{ fontWeight: 600 }}>
              {activeData.yLabel}
            </text>

            {/* Squared Error Area Boxes */}
            {isLineVisible &&
              showSquareBoxes &&
              activeData.points.map((p, i) => {
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

            {/* OLS Target Line */}
            {showOlsTarget && (
              <line
                className="tw-lr-ols-line"
                x1={px(xMin)}
                y1={py(ols.b1 * xMin + ols.b0)}
                x2={px(xMax)}
                y2={py(ols.b1 * xMax + ols.b0)}
              />
            )}

            {/* Candidate Line */}
            {isLineVisible && (
              <line
                className="tw-lr-line"
                x1={px(xMin)}
                y1={py(b1 * xMin + b0)}
                x2={px(xMax)}
                y2={py(b1 * xMax + b0)}
              />
            )}

            {/* Residual Lines */}
            {isLineVisible &&
              isResidVisible &&
              activeData.points.map((p, i) => {
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
              activeData.points.map((p, i) => {
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

            {/* Data Points */}
            {activeData.points.map((p, i) => (
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

            {/* Convergence indicator */}
            {stepIndex === 8 && (
              <g transform={`translate(${SVG_W / 2}, ${PAD.t + 16})`}>
                <rect x="-85" y="-14" width="170" height="28" rx="14" fill="var(--good)" opacity="0.95" />
                <text x="0" y="4" fill="#fff" textAnchor="middle" fontSize="11.5" fontWeight="600">
                  ★ Converged to OLS Fit
                </text>
              </g>
            )}
          </svg>
        </>
      }
      parameterControls={
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <div className="tw-ctrl-group">
            <span className="tw-ctrl-label">Slope (b₁):</span>
            <input
              type="range"
              min={Number((ols.b1 - 2).toFixed(1))}
              max={Number((ols.b1 + 2).toFixed(1))}
              step="0.05"
              value={b1}
              onChange={(e) => {
                setB1(Number(e.target.value))
                if (stepIndex === 0) setStepIndex(1)
              }}
              style={{ width: 100, accentColor: 'var(--blue)' }}
            />
            <b>{b1.toFixed(2)}</b>
          </div>

          <div className="tw-ctrl-group">
            <span className="tw-ctrl-label">Intercept (b₀):</span>
            <input
              type="range"
              min={Number((ols.b0 - 5).toFixed(1))}
              max={Number((ols.b0 + 5).toFixed(1))}
              step="0.2"
              value={b0}
              onChange={(e) => {
                setB0(Number(e.target.value))
                if (stepIndex === 0) setStepIndex(1)
              }}
              style={{ width: 100, accentColor: 'var(--blue)' }}
            />
            <b>{b0.toFixed(1)}</b>
          </div>

          <div className="tw-divider" />

          <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Target OLS: <code>ŷ = {ols.b1.toFixed(2)}x + {ols.b0.toFixed(2)}</code> (MSE: {olsMSE.toFixed(2)})
          </div>
        </div>
      }
      playbackControls={
        <TeacherPlaybackControls
          isPlaying={isPlaying}
          speed={speed}
          canPrev={stepIndex > 0}
          canNext={stepIndex < LR_STEPS.length - 1}
          onReset={resetModelToInit}
          onPrev={handlePrev}
          onNext={handleNext}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onSpeedChange={setSpeed}
        />
      }
      statusExplanation={
        <TeacherExplanationPanel
          stepNumber={stepIndex + 1}
          totalSteps={LR_STEPS.length}
          stepTitle={curStep.title}
          shortSummary={curStep.short}
          whatIsHappening={curStep.what}
          whyItMatters={curStep.why}
          metrics={[
            { label: 'Slope', value: b1.toFixed(2) },
            { label: 'Intercept', value: b0.toFixed(1) },
            { label: 'MSE', value: currentMSE.toFixed(3) },
            { label: 'Iteration', value: iteration },
            { label: 'Points', value: activeData.points.length },
          ]}
          talkingPoint={curStep.talkingPoint}
        />
      }
    />
  )
}

export default TeacherLinearRegression
