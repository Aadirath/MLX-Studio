import { useEffect, useRef, useState } from 'react'
import './LinearRegression.css'

const X = [1, 2, 3, 4, 5, 6, 6.5, 7, 8, 9]
const Y = [2.1, 2.9, 4.2, 4.8, 6.1, 6.9, 7.3, 7.8, 8.6, 9.4]
const N = X.length
const MEAN_X = X.reduce((a, b) => a + b, 0) / N
const MEAN_Y = Y.reduce((a, b) => a + b, 0) / N
const STD_X = Math.sqrt(X.reduce((s, x) => s + (x - MEAN_X) ** 2, 0) / N)
const STD_Y = Math.sqrt(Y.reduce((s, y) => s + (y - MEAN_Y) ** 2, 0) / N)
const XN = X.map((x) => (x - MEAN_X) / STD_X)
const YN = Y.map((y) => (y - MEAN_Y) / STD_Y)

const START_M = -1.2
const START_B = 1.0
const MAX_STEPS = 12
const CONVERGENCE_EPS = 0.0005
const RUN_DELAY_MS = 650

function realM(mn) {
  return (mn * STD_Y) / STD_X
}

function realB(mn, bn) {
  return MEAN_Y - realM(mn) * MEAN_X + bn * STD_Y
}

function mse(m, b) {
  let s = 0
  for (let i = 0; i < N; i++) {
    const e = m * X[i] + b - Y[i]
    s += e * e
  }
  return s / N
}

function grad(mn, bn) {
  let dm = 0
  let db = 0
  for (let i = 0; i < N; i++) {
    const p = mn * XN[i] + bn
    const e = p - YN[i]
    dm += e * XN[i]
    db += e
  }
  return { dm: (2 * dm) / N, db: (2 * db) / N }
}

function makeScale(xMin, xMax, yMin, yMax, padL, padR, padT, padB, W, H) {
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  return {
    px: (x) => padL + ((x - xMin) / (xMax - xMin)) * plotW,
    py: (y) => padT + plotH - ((y - yMin) / (yMax - yMin)) * plotH,
  }
}

const SCALE = makeScale(0, 10, 0, 11, 48, 16, 14, 36, 560, 340)

const INITIAL_SIM = { mn: START_M, bn: START_B, step: 0, prevMse: null, converged: false }
const INITIAL_ANNOTATION = {
  kind: null,
  html: 'Press "Step forward" to begin. The line starts in a deliberately bad position so the fitting process is visible.',
}

function computeStep(sim, learningRate, guess) {
  const prevM = realM(sim.mn)
  const prevB = realB(sim.mn, sim.bn)
  const prevMse = mse(prevM, prevB)
  const g = grad(sim.mn, sim.bn)
  const dir = g.dm < 0 ? 'up' : 'down'

  const nextMn = sim.mn - learningRate * g.dm
  const nextBn = sim.bn - learningRate * g.db
  const nextStep = sim.step + 1
  const newM = realM(nextMn)
  const newB = realB(nextMn, nextBn)
  const newMse = mse(newM, newB)

  const dirWord = dir === 'up' ? 'increased' : 'decreased'
  const reason =
    dir === 'up'
      ? 'the higher-area listings were still being underestimated'
      : 'the higher-area listings were being overestimated'

  let html = `<span class="tag">Step ${nextStep}</span>Slope ${dirWord} from ${prevM.toFixed(2)} to ${newM.toFixed(2)}, because ${reason}. Error (MSE) went from ${prevMse.toFixed(3)} to ${newMse.toFixed(3)}.`
  let kind = null
  if (guess) {
    const correct = guess === dir
    kind = correct ? 'fbGood' : 'fbBad'
    html = `<span class="tag">${correct ? 'Correct' : 'Not quite'}</span>${html}`
  }

  const done = nextStep >= MAX_STEPS || Math.abs(newMse - prevMse) < CONVERGENCE_EPS
  if (done) {
    html += ' The line has settled here, further steps barely change it. That is convergence.'
  }

  return {
    sim: { mn: nextMn, bn: nextBn, step: nextStep, prevMse, converged: done },
    annotation: { html, kind },
  }
}

function LinearRegression() {
  const [sim, setSim] = useState(INITIAL_SIM)
  const [learningRate, setLearningRate] = useState(0.3)
  const [predictBeforeStep, setPredictBeforeStep] = useState(true)
  const [awaitingGuess, setAwaitingGuess] = useState(false)
  const [running, setRunning] = useState(false)
  const [annotation, setAnnotation] = useState(INITIAL_ANNOTATION)

  const simRef = useRef(sim)
  const timerRef = useRef(null)

  useEffect(() => {
    simRef.current = sim
  }, [sim])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  function doStep(guess) {
    const result = computeStep(simRef.current, learningRate, guess)
    simRef.current = result.sim
    setSim(result.sim)
    setAnnotation(result.annotation)
    return result.sim.converged
  }

  function handleStepClick() {
    if (predictBeforeStep) setAwaitingGuess(true)
    else doStep(null)
  }

  function handleGuess(guess) {
    setAwaitingGuess(false)
    doStep(guess)
  }

  function handleRun() {
    if (running || simRef.current.converged) return
    setRunning(true)
    const wasPredict = predictBeforeStep
    setPredictBeforeStep(false)
    const tick = () => {
      const done = doStep(null)
      if (!done) {
        timerRef.current = setTimeout(tick, RUN_DELAY_MS)
      } else {
        setRunning(false)
        setPredictBeforeStep(wasPredict)
      }
    }
    tick()
  }

  function handleReset() {
    clearTimeout(timerRef.current)
    simRef.current = INITIAL_SIM
    setSim(INITIAL_SIM)
    setRunning(false)
    setAwaitingGuess(false)
    setAnnotation(INITIAL_ANNOTATION)
  }

  const m = realM(sim.mn)
  const b = realB(sim.mn, sim.bn)
  const currentMse = mse(m, b)
  const improving = sim.prevMse !== null && currentMse < sim.prevMse

  return (
    <div className="linreg">
      <div className="linreg-controls">
        <div className="field">
          <label htmlFor="lr">
            Learning rate: <span className="value">{learningRate.toFixed(2)}</span>
          </label>
          <input
            id="lr"
            type="range"
            min="0.05"
            max="0.6"
            step="0.01"
            value={learningRate}
            onChange={(e) => setLearningRate(parseFloat(e.target.value))}
          />
        </div>

        <div className="field">
          <div className="toggle-row">
            <label htmlFor="predictToggle" style={{ marginBottom: 0 }}>
              Predict before each step
            </label>
            <span className="switch">
              <input
                id="predictToggle"
                type="checkbox"
                checked={predictBeforeStep}
                onChange={(e) => setPredictBeforeStep(e.target.checked)}
              />
              <span className="pill-slider" />
            </span>
          </div>
          <p className="note" style={{ marginTop: 8 }}>
            On: guess which way the slope will move. Off: just watch each step.
          </p>
        </div>

        {!awaitingGuess ? (
          <div className="btnCol">
            <button className="btnP" onClick={handleStepClick} disabled={sim.converged || running}>
              Step forward
            </button>
            <button className="btnG" onClick={handleRun} disabled={sim.converged || running}>
              {running ? 'Running…' : 'Run to convergence'}
            </button>
            <button className="btnG" onClick={handleReset}>
              Reset to step 0
            </button>
          </div>
        ) : (
          <div className="btnCol">
            <p className="note" style={{ margin: '0 0 2px' }}>
              Will the slope go up or down?
            </p>
            <button className="guessBtn" onClick={() => handleGuess('up')}>
              Slope will go up
            </button>
            <button className="guessBtn" onClick={() => handleGuess('down')}>
              Slope will go down
            </button>
          </div>
        )}
      </div>

      <div className="linreg-main">
        <div className="chartRow">
          <span className="chartTitle">Area vs. price, 10 sampled listings</span>
          <div className="readouts">
            <span>
              Step <b>{sim.step}</b>
            </span>
            <span>
              Error (MSE) <b className={`mseVal${improving ? ' improving' : ''}`}>{currentMse.toFixed(3)}</b>
            </span>
          </div>
        </div>

        <svg viewBox="0 0 560 340" role="img" aria-label="Interactive linear regression chart">
          <line x1={SCALE.px(0)} y1={SCALE.py(0)} x2={SCALE.px(0)} y2={SCALE.py(11)} stroke="#C9C1A8" />
          <line x1={SCALE.px(0)} y1={SCALE.py(0)} x2={SCALE.px(10)} y2={SCALE.py(0)} stroke="#C9C1A8" />
          <text className="axLbl" x={SCALE.px(5)} y="332" textAnchor="middle">
            Area (100 sq ft)
          </text>
          <text
            className="axLbl"
            x="14"
            y={SCALE.py(5.5)}
            textAnchor="middle"
            transform={`rotate(-90 14 ${SCALE.py(5.5)})`}
          >
            Price (₹ lakh)
          </text>

          {X.map((x, i) => {
            const predicted = m * x + b
            return (
              <line
                key={`residual-${i}`}
                x1={SCALE.px(x)}
                y1={SCALE.py(Y[i])}
                x2={SCALE.px(x)}
                y2={SCALE.py(predicted)}
                stroke="var(--rust)"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.55"
              />
            )
          })}

          <line
            x1={SCALE.px(0)}
            y1={SCALE.py(b)}
            x2={SCALE.px(10)}
            y2={SCALE.py(m * 10 + b)}
            stroke="var(--blue)"
            strokeWidth="2.5"
          />

          {X.map((x, i) => (
            <circle key={`point-${i}`} cx={SCALE.px(x)} cy={SCALE.py(Y[i])} r="4" fill="var(--ink)" />
          ))}
        </svg>

        <div
          className={`annotation${annotation.kind ? ` ${annotation.kind}` : ''}`}
          dangerouslySetInnerHTML={{ __html: annotation.html }}
        />
      </div>
    </div>
  )
}

export default LinearRegression
