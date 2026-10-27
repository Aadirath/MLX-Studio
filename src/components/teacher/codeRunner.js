// A real, sandboxed runner for the "Run and break it" tab in teacher mode.
//
// The Python shown beside the picture is for reading. This is a JavaScript twin of the same algorithm that actually
// runs, in a Web Worker, on the same data. If the code has a bug, the learner sees the real error and the line.

import { HOUSING_X, HOUSING_Y, TWO_GROUPS } from '../../data/sampleData.js'

export const SANDBOX_DATA = { X: HOUSING_X, Y: HOUSING_Y, N: HOUSING_X.length, points: TWO_GROUPS }

// Runs the learner's code once. Self-contained on purpose: its source text is copied into the worker.
export function executeSandboxed(code, data) {
  const started = Date.now()
  const lineOf = (err) => {
    const stack = String((err && err.stack) || '')
    const patterns = [/<anonymous>:(\d+):\d+/, /Function:(\d+):\d+/, /eval:(\d+):\d+/]
    for (const re of patterns) {
      const m = re.exec(stack)
      if (m) return Number(m[1])
    }
    return null
  }
  const wrap = (body) => new Function('X', 'Y', 'N', 'points', '"use strict";\n' + body)

  // Different browsers count lines differently inside new Function, so measure the offset with a probe.
  let offset = 0
  try {
    wrap('throw new Error("probe")')(1, 1, 1, 1)
  } catch (err) {
    const l = lineOf(err)
    offset = l ? l - 1 : 0
  }

  let fn
  try {
    fn = wrap(code)
  } catch (err) {
    return { ok: false, kind: 'syntax', name: err.name, message: String(err.message), line: null, ms: Date.now() - started }
  }
  try {
    const result = fn(data.X, data.Y, data.N, data.points)
    if (result === null || typeof result !== 'object') {
      return { ok: false, kind: 'return', name: 'Error', message: 'The code must end with: return { ... } listing the numbers to show.', line: null, ms: Date.now() - started }
    }
    return { ok: true, result, ms: Date.now() - started }
  } catch (err) {
    const l = lineOf(err)
    return { ok: false, kind: 'runtime', name: (err && err.name) || 'Error', message: String((err && err.message) || err), line: l ? Math.max(1, l - offset) : null, ms: Date.now() - started }
  }
}

export const WORKER_SOURCE = `${executeSandboxed.toString()}
self.onmessage = (e) => {
  let out = executeSandboxed(e.data.code, e.data.data)
  try { self.postMessage(out) } catch (err) {
    self.postMessage({ ok: false, kind: 'return', name: 'Error', message: 'The result could not be sent back. Return only numbers, text and arrays.', line: null, ms: 0 })
  }
}`

// Runs code in a fresh worker and gives up after timeoutMs, so an infinite loop cannot freeze the page.
export function runInWorker(code, data = SANDBOX_DATA, timeoutMs = 2000) {
  return new Promise((resolve) => {
    let worker
    let url
    try {
      url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: 'text/javascript' }))
      worker = new Worker(url)
    } catch {
      resolve({ ok: false, kind: 'worker', name: 'Error', message: 'This browser cannot run the code sandbox.', line: null, ms: 0 })
      return
    }
    const finish = (value) => {
      clearTimeout(timer)
      worker.terminate()
      URL.revokeObjectURL(url)
      resolve(value)
    }
    const timer = setTimeout(
      () => finish({ ok: false, kind: 'timeout', name: 'Timeout', message: `Stopped after ${timeoutMs / 1000} seconds. The code is probably stuck in a loop that never ends.`, line: null, ms: timeoutMs }),
      timeoutMs,
    )
    worker.onmessage = (e) => finish(e.data)
    worker.onerror = (e) => finish({ ok: false, kind: 'runtime', name: 'Error', message: String(e.message || 'Unknown error'), line: null, ms: 0 })
    worker.postMessage({ code, data })
  })
}

// ---------------------------------------------------------------------------------------------
// The correct code for each algorithm, and the bugs a learner can switch on with one click.
// ---------------------------------------------------------------------------------------------

const descentCode = (slope0, intercept0, rate, steps) => `// A JavaScript twin of the Python algorithm. It really runs, in your browser, on the housing data.
// X and Y are the data (area, price) and N is how many points. End with return { ... }.
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length
const std = (a) => Math.sqrt(mean(a.map((v) => (v - mean(a)) ** 2)))
const Xs = X.map((v) => (v - mean(X)) / std(X))
const ys = Y.map((v) => (v - mean(Y)) / std(Y))

let slope = ${slope0}
let intercept = ${intercept0}
const learningRate = ${rate}
const losses = []

for (let i = 0; i < ${steps}; i++) {
  const error = Xs.map((x, j) => slope * x + intercept - ys[j])
  losses.push(mean(error.map((e) => e * e)))
  const gradSlope = (2 / N) * error.reduce((s, e, j) => s + e * Xs[j], 0)
  const gradIntercept = (2 / N) * error.reduce((s, e) => s + e, 0)
  slope = slope - learningRate * gradSlope
  intercept = intercept - learningRate * gradIntercept
}

return { losses, slope, intercept }
`

// Each helper returns the changed code, or null when the learner has already edited that part away.
const sub = (from, to) => (code) => (code.includes(from) ? code.replace(from, to) : null)
const subRegex = (re, to) => (code) => (re.test(code) ? code.replace(re, to) : null)

const descentBugs = (highRate) => [
  {
    id: 'sign',
    label: 'Wrong sign',
    apply: (code) => {
      const one = sub('slope = slope - learningRate * gradSlope', 'slope = slope + learningRate * gradSlope')(code)
      return one && sub('intercept = intercept - learningRate * gradIntercept', 'intercept = intercept + learningRate * gradIntercept')(one)
    },
    explain:
      'The update added the gradient instead of subtracting it. The gradient points uphill, so every step climbed away from the minimum and the loss grew. No error message appears: the code runs, the answer is just wrong.',
  },
  {
    id: 'rate',
    label: `Learning rate ${highRate}`,
    apply: subRegex(/const learningRate = [\d.]+/, `const learningRate = ${highRate}`),
    explain: `With a learning rate of ${highRate} each step overshoots the bottom and lands higher on the other side, so the loss grows. This is the same jump-around you see on the error surface.`,
  },
  {
    id: 'typo',
    label: 'Typo in a name',
    apply: sub('intercept - learningRate * gradIntercept', 'intercept - learningRate * gradIntercpt'),
    explain: 'A misspelt variable name is a real error. The computer stops and tells you the name it does not know, and on which line.',
  },
  {
    id: 'scale',
    label: 'Forgot to divide by N',
    apply: sub('(2 / N) * error.reduce((s, e, j) => s + e * Xs[j], 0)', '2 * error.reduce((s, e, j) => s + e * Xs[j], 0)'),
    explain:
      'Without dividing by N the slope gradient is ten times too big, which acts like a learning rate ten times larger, so the loss blows up. A small formula slip can look just like a bad learning rate.',
  },
  {
    id: 'loop',
    label: 'Loop never ends',
    apply: subRegex(/for \(let i = 0; i < (\d+); i\+\+\) \{/, 'let i = 0\nwhile (i < $1) {'),
    explain:
      'The counter i is never increased, so the loop never finishes. The sandbox stops the code after two seconds so the page stays alive. An endless loop gives no error at all, only silence.',
  },
]

export const RUN_TEMPLATES = {
  'gradient-descent': {
    title: 'Gradient descent',
    code: descentCode(-1.2, 1.0, 0.3, 30),
    bugs: descentBugs('1.10'),
    series: 'losses',
    seriesLabel: 'Loss after each step (log scale)',
  },
  'linear-regression': {
    title: 'Linear regression (by gradient descent)',
    code: descentCode(0, 0.5, 0.2, 40),
    bugs: [
      ...descentBugs('1.5'),
      {
        id: 'square',
        label: 'Forgot to square the error',
        apply: sub('losses.push(mean(error.map((e) => e * e)))', 'losses.push(mean(error))'),
        explain:
          'Without squaring, errors above and below the line cancel each other out, so the loss reads almost zero even when the line is not a perfect fit. The line still improves, because the gradients are unchanged, which makes this bug easy to miss: only the number you are watching is wrong. Compare the final loss with the correct run.',
      },
    ],
    series: 'losses',
    seriesLabel: 'Loss after each step (log scale)',
  },
  'k-means': {
    title: 'K-means',
    code: `// A JavaScript twin of the Python algorithm. It really runs, in your browser, on the "Two groups" points.
// points is a list of [x, y]. End with return { ... }.
const K = 2
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])

// Spread-out start: the first point, then the point farthest from the centres chosen so far.
let centroids = [points[0]]
while (centroids.length < K) {
  const nearest = (p) => Math.min(...centroids.map((c) => dist(p, c)))
  centroids.push(points.reduce((best, p) => (nearest(p) > nearest(best) ? p : best)))
}
centroids = centroids.map((c) => [...c])

const sse = []
let labels = []
for (let iter = 0; iter < 10; iter++) {
  labels = points.map((p) => {
    const d = centroids.map((c) => dist(p, c))
    return d.indexOf(Math.min(...d))
  })
  sse.push(points.reduce((s, p, i) => s + dist(p, centroids[labels[i]]) ** 2, 0))
  centroids = centroids.map((c, k) => {
    const members = points.filter((_, i) => labels[i] === k)
    return [
      members.reduce((s, p) => s + p[0], 0) / members.length,
      members.reduce((s, p) => s + p[1], 0) / members.length,
    ]
  })
}

return { sse, centroids, labels }
`,
    bugs: [
      {
        id: 'farthest',
        label: 'Join the farthest centre',
        apply: sub('return d.indexOf(Math.min(...d))', 'return d.indexOf(Math.max(...d))'),
        explain: 'Points joined the farthest centre instead of the nearest, so the total spread (cost J) stays high instead of falling. The code runs fine, which is why checking the cost matters.',
      },
      {
        id: 'bigk',
        label: 'K larger than the data',
        apply: sub('const K = 2', 'const K = 20'),
        explain: 'With 20 centres and only 16 points, some centres get no points. Their mean divides by zero and becomes NaN, and the next step crashes. In practice, K should be much smaller than the number of points.',
      },
      {
        id: 'still',
        label: 'Centres never move',
        apply: sub('centroids = centroids.map((c, k) => {', 'centroids = centroids.map((c, k) => {\n    return c // the update step now returns the old centre'),
        explain:
          'The update step hands back the old centre, so the centres never move. Points are assigned once and nothing improves: the cost stays flat at its starting value instead of falling. The code runs without any error.',
      },
      {
        id: 'typo',
        label: 'Typo in a name',
        apply: sub('const d = centroids.map((c) => dist(p, c))', 'const d = centroid.map((c) => dist(p, c))'),
        explain: 'A misspelt variable name is a real error. The computer stops and names the variable it does not know, and the line it was on.',
      },
    ],
    series: 'sse',
    seriesLabel: 'Total spread (cost J) after each pass (log scale)',
  },
}

// Applies one bug to the correct code. Returns null if the code was changed too much for the bug to fit.
export function applyBug(template, bugId, code) {
  const bug = template.bugs.find((b) => b.id === bugId)
  if (!bug) return null
  const out = bug.apply(code)
  return out && out !== code ? out : null
}
