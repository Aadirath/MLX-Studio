// Shared helpers for the terrain hero and the topic illustrations.
const VIRIDIS = [
  '#440154', '#482878', '#3E4A89', '#31688E', '#26828E',
  '#1F9E89', '#35B779', '#6DCD59', '#B4DE2C', '#FDE725',
].map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)])

export function ramp(t) {
  const x = Math.min(1, Math.max(0, t)) * (VIRIDIS.length - 1)
  const i = Math.min(VIRIDIS.length - 2, Math.floor(x))
  const f = x - i
  const a = VIRIDIS[i]
  const b = VIRIDIS[i + 1]
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
}

export const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`

// Turn any CSS colour into [r, g, b] by letting a canvas parse it.
export function resolveColor(ctx, css, fallback) {
  try {
    ctx.save()
    ctx.fillStyle = '#000000'
    ctx.fillStyle = css
    const v = String(ctx.fillStyle)
    ctx.restore()
    const hex = /^#([0-9a-f]{6})$/i.exec(v)
    if (hex) return [parseInt(hex[1].slice(0, 2), 16), parseInt(hex[1].slice(2, 4), 16), parseInt(hex[1].slice(4, 6), 16)]
    const rgb = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(v)
    if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])]
  } catch {
    // fall through to the fallback colour
  }
  return fallback
}

// Gradient of L = (u/A)^2 + (v/B)^2 for an ellipse centred at (cx, cy) rotated by th.
export function gradEllipse(x, y, cx, cy, A, B, th) {
  const dx = x - cx
  const dy = y - cy
  const c = Math.cos(th)
  const s = Math.sin(th)
  const u = dx * c + dy * s
  const v = -dx * s + dy * c
  const gu = (2 * u) / (A * A)
  const gv = (2 * v) / (B * B)
  return [gu * c - gv * s, gu * s + gv * c]
}

export function starPath(cx, cy, r1, r2) {
  let d = ''
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? r2 : r1
    const a = -Math.PI / 2 + (i * Math.PI) / 5
    d += `${i ? 'L' : 'M'}${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`
  }
  return `${d}Z`
}
