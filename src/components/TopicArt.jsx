import { gradEllipse, ramp, rgba, starPath } from '../utils/terrain.js'

function rng(seed) {
  let s = seed
  return () => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const frame = { viewBox: '0 0 160 100', preserveAspectRatio: 'xMidYMid slice', role: 'img' }

// Linear regression: points scattered around a fitted line.
const LR = (() => {
  const r = rng(11)
  const onLine = (x) => 80 - (x - 18) * (57 / 128)
  return Array.from({ length: 10 }, (_, i) => {
    const x = 26 + i * 12.2
    return { x, y: onLine(x) + (r() - 0.5) * 20, fit: onLine(x) }
  })
})()

function ArtLinearRegression() {
  return (
    <svg {...frame} aria-label="Points scattered around a fitted line">
      <rect width="160" height="100" fill="var(--surface)" />
      <path d="M14 88H150M14 88V10" stroke="var(--line-strong)" strokeWidth="1.2" fill="none" />
      <path d="M18 80L146 23" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" />
      {LR.map((p) => (
        <g key={p.x}>
          <path d={`M${p.x.toFixed(1)} ${p.y.toFixed(1)}V${p.fit.toFixed(1)}`} stroke="var(--danger)" strokeWidth="1" strokeDasharray="2 2" />
          <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r="3" fill="var(--ink)" />
        </g>
      ))}
    </svg>
  )
}

// Gradient descent: contour map with a path that actually reaches the minimum.
const GD = (() => {
  const cx = 108
  const cy = 52
  const A = 66
  const B = 26
  const th = -0.42
  const k = 0.55 * B * B
  let p = [24, 16]
  const pts = [p]
  for (let i = 0; i < 13; i++) {
    const g = gradEllipse(p[0], p[1], cx, cy, A, B, th)
    p = [p[0] - k * g[0], p[1] - k * g[1]]
    pts.push(p)
  }
  return { cx, cy, A, B, th, pts }
})()

const GD_LEVELS = [1, 0.7, 0.46, 0.28, 0.14, 0.05]

function ArtGradientDescent() {
  const d = GD.pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join('')
  return (
    <svg {...frame} aria-label="Contour map of an error surface with a descent path">
      <rect width="160" height="100" fill="var(--surface)" />
      {GD_LEVELS.map((l) => (
        <ellipse
          key={l}
          cx={GD.cx}
          cy={GD.cy}
          rx={(GD.A * Math.sqrt(l)).toFixed(1)}
          ry={(GD.B * Math.sqrt(l)).toFixed(1)}
          transform={`rotate(${((GD.th * 180) / Math.PI).toFixed(1)} ${GD.cx} ${GD.cy})`}
          fill={rgba(ramp(1 - Math.sqrt(l)), 0.2 + 0.6 * (1 - Math.sqrt(l)))}
          stroke="rgba(255,255,255,.18)"
          strokeWidth=".6"
        />
      ))}
      <path d={d} fill="none" stroke="rgba(8,12,30,.85)" strokeWidth="3" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      {GD.pts.map((q) => (
        <circle key={`${q[0]}-${q[1]}`} cx={q[0].toFixed(1)} cy={q[1].toFixed(1)} r="1.7" fill="#fff" />
      ))}
      <path d={starPath(GD.cx, GD.cy, 6, 2.6)} fill="#FDE725" stroke="rgba(8,12,30,.9)" strokeWidth="1" />
    </svg>
  )
}

// K-means: three groups drawn with different marker shapes, so colour is not the only cue.
const KM = (() => {
  const r = rng(5)
  const groups = [
    { cx: 40, cy: 34, color: 'var(--primary)', shape: 'circle' },
    { cx: 112, cy: 30, color: 'var(--success)', shape: 'square' },
    { cx: 78, cy: 74, color: 'var(--danger)', shape: 'triangle' },
  ]
  return groups.map((g) => ({
    ...g,
    pts: Array.from({ length: 8 }, () => [g.cx + (r() - 0.5) * 34, g.cy + (r() - 0.5) * 26]),
  }))
})()

function Marker({ shape, x, y, color }) {
  if (shape === 'circle') return <circle cx={x.toFixed(1)} cy={y.toFixed(1)} r="3.2" fill={color} />
  if (shape === 'square') return <rect x={(x - 3).toFixed(1)} y={(y - 3).toFixed(1)} width="6" height="6" fill={color} />
  return <path d={`M${x.toFixed(1)} ${(y - 3.6).toFixed(1)}L${(x + 3.6).toFixed(1)} ${(y + 3).toFixed(1)}L${(x - 3.6).toFixed(1)} ${(y + 3).toFixed(1)}Z`} fill={color} />
}

function ArtKMeans() {
  return (
    <svg {...frame} aria-label="Three clusters drawn with different marker shapes">
      <rect width="160" height="100" fill="var(--surface)" />
      {KM.map((g) => (
        <g key={g.shape}>
          {g.pts.map((q) => (
            <Marker key={`${q[0]}-${q[1]}`} shape={g.shape} x={q[0]} y={q[1]} color={g.color} />
          ))}
          <path d={`M${g.cx} ${g.cy - 6}L${g.cx + 6} ${g.cy}L${g.cx} ${g.cy + 6}L${g.cx - 6} ${g.cy}Z`} fill="none" stroke="var(--ink)" strokeWidth="1.6" />
        </g>
      ))}
    </svg>
  )
}

const ART = {
  'linear-regression': ArtLinearRegression,
  'gradient-descent': ArtGradientDescent,
  'k-means': ArtKMeans,
}

export function TopicArt({ id }) {
  const Art = ART[id]
  return Art ? <Art /> : null
}
