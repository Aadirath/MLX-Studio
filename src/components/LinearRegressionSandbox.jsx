import { useRef, useState } from 'react'
import './LinearRegressionSandbox.css'

const W = 560
const H = 340
const PAD = { l: 52, r: 20, t: 16, b: 36 }

let nextId = 1
const makeRow = (x = '', y = '') => ({ id: nextId++, x, y })
const makeRows = (n) => Array.from({ length: n }, () => makeRow())

function toNumber(text) {
  const t = text.trim()
  if (t === '') return NaN
  const n = Number(t)
  return Number.isFinite(n) ? n : NaN
}

function parseCsv(text) {
  const parsed = []
  for (const line of text.split(/\r?\n/)) {
    if (line.trim().length === 0) continue
    const cells = line.split(',').map((c) => c.trim())
    if (cells.length < 2) continue
    const x = toNumber(cells[0])
    const y = toNumber(cells[1])
    if (!Number.isNaN(x) && !Number.isNaN(y)) parsed.push([x, y])
  }
  return parsed
}

function readManualRows(rows) {
  const points = []
  for (let i = 0; i < rows.length; i++) {
    const xs = rows[i].x.trim()
    const ys = rows[i].y.trim()
    if (xs === '' && ys === '') continue
    const x = toNumber(xs)
    const y = toNumber(ys)
    if (Number.isNaN(x) || Number.isNaN(y)) {
      return { error: `Row ${i + 1} has a non-numeric value. Every row needs two numbers.` }
    }
    points.push([x, y])
  }
  return { points }
}

function ols(points) {
  const n = points.length
  const xbar = points.reduce((a, p) => a + p[0], 0) / n
  const ybar = points.reduce((a, p) => a + p[1], 0) / n
  let sxy = 0
  let sxx = 0
  for (const [x, y] of points) {
    sxy += (x - xbar) * (y - ybar)
    sxx += (x - xbar) ** 2
  }
  if (sxx === 0) return null // all x identical, slope undefined
  const b1 = sxy / sxx
  return { b0: ybar - b1 * xbar, b1 }
}

function mse(points, b0, b1) {
  let s = 0
  for (const [x, y] of points) s += (y - (b1 * x + b0)) ** 2
  return s / points.length
}

function ticks(min, max, count = 5) {
  return Array.from({ length: count }, (_, i) => min + ((max - min) * i) / (count - 1))
}

const fmtTick = (v) => String(Number(v.toPrecision(3)))

function SandboxChart({ points, fit }) {
  const xs = points.map((p) => p[0])
  const ys = points.map((p) => p[1])
  const xMin0 = Math.min(...xs)
  const xMax0 = Math.max(...xs)
  const yMin0 = Math.min(...ys)
  const yMax0 = Math.max(...ys)
  const xPad = (xMax0 - xMin0) * 0.15 || 1
  const yPad = (yMax0 - yMin0) * 0.15 || 1
  const xMin = xMin0 - xPad
  const xMax = xMax0 + xPad
  const yMin = yMin0 - yPad
  const yMax = yMax0 + yPad
  const plotW = W - PAD.l - PAD.r
  const plotH = H - PAD.t - PAD.b
  const px = (x) => PAD.l + ((x - xMin) / (xMax - xMin)) * plotW
  const py = (y) => PAD.t + plotH - ((y - yMin) / (yMax - yMin)) * plotH

  const xAxisY = py(yMin <= 0 && 0 <= yMax ? 0 : yMin)
  const yAxisX = px(xMin0 - xPad * 0.3)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Scatter plot of your data with a fitted regression line">
      <line x1={px(xMin)} y1={xAxisY} x2={px(xMax)} y2={xAxisY} stroke="#C9C1A8" />
      <line x1={yAxisX} y1={py(yMin)} x2={yAxisX} y2={py(yMax)} stroke="#C9C1A8" />
      {ticks(xMin0, xMax0).map((v) => (
        <text key={`x${v}`} className="axLbl" x={px(v)} y={H - 14} textAnchor="middle">
          {fmtTick(v)}
        </text>
      ))}
      {ticks(yMin0, yMax0).map((v) => (
        <text key={`y${v}`} className="axLbl" x={PAD.l - 8} y={py(v) + 3} textAnchor="end">
          {fmtTick(v)}
        </text>
      ))}
      {points.map(([x, y], i) => (
        <line
          key={`r${i}`}
          x1={px(x)}
          y1={py(y)}
          x2={px(x)}
          y2={py(fit.b1 * x + fit.b0)}
          stroke="var(--rust)"
          strokeWidth="1"
          strokeDasharray="2 2"
          opacity="0.55"
        />
      ))}
      <line
        x1={px(xMin)}
        y1={py(fit.b1 * xMin + fit.b0)}
        x2={px(xMax)}
        y2={py(fit.b1 * xMax + fit.b0)}
        stroke="var(--blue)"
        strokeWidth="2.5"
      />
      {points.map(([x, y], i) => (
        <circle key={`p${i}`} cx={px(x)} cy={py(y)} r="4" fill="var(--ink)" />
      ))}
    </svg>
  )
}

function LinearRegressionSandbox() {
  const [mode, setMode] = useState('manual')
  const [rows, setRows] = useState(() => makeRows(4))
  const [csvRows, setCsvRows] = useState(null)
  const [csvNote, setCsvNote] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const fileRef = useRef(null)

  const updateRow = (id, field, value) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  const removeRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id))

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const parsed = parseCsv(String(ev.target.result))
      setCsvRows(parsed)
      setCsvNote(`Loaded ${parsed.length} valid numeric rows from ${file.name}.`)
      setError('')
    }
    reader.readAsText(file)
  }

  const handleFit = () => {
    setError('')
    let points
    if (mode === 'csv') {
      if (!csvRows) {
        setError('Upload a CSV file first.')
        return
      }
      points = csvRows
    } else {
      const r = readManualRows(rows)
      if (r.error) {
        setError(r.error)
        return
      }
      points = r.points
    }
    if (points.length < 2) {
      setError('Need at least 2 points to fit a line.')
      return
    }
    const fit = ols(points)
    if (!fit) {
      setError(
        "All your X values are identical, a line's slope is undefined for a single vertical scatter. Vary the X values and try again.",
      )
      return
    }
    setResult({ points, fit, mse: mse(points, fit.b0, fit.b1) })
  }

  const clearRows = () => setRows(makeRows(2))

  return (
    <div className="lrsb">
      <div className="lrsb-input">
        <div className="modeRow">
          <button className={mode === 'manual' ? 'active' : ''} onClick={() => setMode('manual')}>
            Enter manually
          </button>
          <button className={mode === 'csv' ? 'active' : ''} onClick={() => setMode('csv')}>
            Upload CSV
          </button>
        </div>

        {mode === 'manual' ? (
          <div>
            <table className="dataTable">
              <thead>
                <tr>
                  <th>X</th>
                  <th>Y</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <input
                        type="text"
                        value={r.x}
                        placeholder="e.g. 2.5"
                        aria-label="X value"
                        onChange={(e) => updateRow(r.id, 'x', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={r.y}
                        placeholder="e.g. 4.1"
                        aria-label="Y value"
                        onChange={(e) => updateRow(r.id, 'y', e.target.value)}
                      />
                    </td>
                    <td>
                      <button className="rmBtn" title="Remove row" onClick={() => removeRow(r.id)}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="btnRow">
              <button className="small" onClick={() => setRows((rs) => [...rs, makeRow()])}>
                + Add row
              </button>
              <button className="small" onClick={clearRows}>
                Clear all
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="fileDrop">
              Upload a .csv file
              <br />
              <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} />
            </div>
            <p className="csvNote">
              First row can be a header or data. We use the first two columns. Rows that are not numeric are skipped.
            </p>
          </div>
        )}

        <button className="computeBtn" onClick={handleFit}>
          Fit a line to this data
        </button>
        {error && <div className="errBox">{error}</div>}
        {!error && mode === 'csv' && csvNote && (
          <div className="csvNote" style={{ marginTop: 8 }}>
            {csvNote}
          </div>
        )}
      </div>

      <div className="lrsb-main">
        {result ? (
          <>
            <div className="chartRow">
              <span className="chartTitle">{result.points.length} points, your data</span>
              <div className="readouts">
                <span>
                  MSE <b className="mseVal">{result.mse.toFixed(3)}</b>
                </span>
              </div>
            </div>
            <SandboxChart points={result.points} fit={result.fit} />
            <div className="resultBox">
              Fitted line:{' '}
              <b>
                ŷ = {result.fit.b0.toFixed(3)} {result.fit.b1 < 0 ? '−' : '+'} {Math.abs(result.fit.b1).toFixed(3)}x
              </b>
              <br />
              Slope (b₁): {result.fit.b1.toFixed(3)} — for every 1 unit increase in x, y changes by about{' '}
              {result.fit.b1.toFixed(3)}.
              <br />
              Intercept (b₀): {result.fit.b0.toFixed(3)} — the line&apos;s predicted y when x is 0.
            </div>
          </>
        ) : (
          <div className="placeholder">Add at least two points, then click &quot;Fit a line to this data&quot;.</div>
        )}
      </div>
    </div>
  )
}

export default LinearRegressionSandbox
