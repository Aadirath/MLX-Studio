// Small, pure helpers behind the theory visuals.

export function ols(xs, ys) {
  const n = xs.length
  const xbar = xs.reduce((a, v) => a + v, 0) / n
  const ybar = ys.reduce((a, v) => a + v, 0) / n
  let sxy = 0
  let sxx = 0
  for (let i = 0; i < n; i += 1) {
    sxy += (xs[i] - xbar) * (ys[i] - ybar)
    sxx += (xs[i] - xbar) ** 2
  }
  const b1 = sxy / sxx
  return { b1, b0: ybar - b1 * xbar }
}

export function mseOf(xs, ys, m, b) {
  let s = 0
  for (let i = 0; i < xs.length; i += 1) s += (m * xs[i] + b - ys[i]) ** 2
  return s / xs.length
}

// ---------- K-means (Lloyd's algorithm) ----------

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])

// First point, then repeatedly the point farthest from the centres chosen so far.
export function seedCentres(points, k) {
  const cents = [points[0]]
  while (cents.length < k) {
    const nearest = (p) => Math.min(...cents.map((c) => dist(p, c)))
    cents.push(points.reduce((best, p) => (nearest(p) > nearest(best) ? p : best)))
  }
  return cents.map((c) => [...c])
}

export function assignPoints(points, cents) {
  return points.map((p) => {
    const d = cents.map((c) => dist(p, c))
    return d.indexOf(Math.min(...d))
  })
}

export function moveCentres(points, labels, cents) {
  return cents.map((c, k) => {
    const mine = points.filter((_, i) => labels[i] === k)
    if (mine.length === 0) return c
    return [mine.reduce((s, p) => s + p[0], 0) / mine.length, mine.reduce((s, p) => s + p[1], 0) / mine.length]
  })
}

export function sseOf(points, labels, cents) {
  return points.reduce((s, p, i) => s + dist(p, cents[labels[i]]) ** 2, 0)
}

// Replays the algorithm for a number of half-steps (odd: assign, even: move), so the picture is always a pure
// function of how many steps were taken. halfSteps = 0 shows the starting centres.
export function lloydAt(points, k, halfSteps) {
  let cents = seedCentres(points, k)
  let labels = null
  let sse = null
  const history = []
  for (let s = 1; s <= halfSteps; s += 1) {
    if (s % 2 === 1) {
      labels = assignPoints(points, cents)
      sse = sseOf(points, labels, cents)
      history.push(sse)
    } else {
      cents = moveCentres(points, labels, cents)
    }
  }
  return { cents, labels, sse, history, phase: halfSteps === 0 ? 'start' : halfSteps % 2 === 1 ? 'assigned' : 'moved' }
}

export function converged(points, k, limit = 40) {
  return lloydAt(points, k, limit)
}

// ---------- one-parameter gradient descent on J(w) = (w - 3)^2 ----------

export const BOWL_MIN = 3
export const BOWL_START = -0.5
export const bowlJ = (w) => (w - BOWL_MIN) ** 2
export const bowlGrad = (w) => 2 * (w - BOWL_MIN)
export function bowlAt(lr, steps) {
  return BOWL_MIN + (BOWL_START - BOWL_MIN) * (1 - 2 * lr) ** steps
}
