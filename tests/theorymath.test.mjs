import assert from 'node:assert/strict'
import { ols, mseOf, lloydAt, converged, bowlAt, bowlGrad, bowlJ } from '../src/components/theory/theoryMath.js'
import { HOUSING_X, HOUSING_Y, TWO_GROUPS } from '../src/data/sampleData.js'
import { RING_POINTS } from '../src/components/kmeansDatasets.js'

const { b1, b0 } = ols(HOUSING_X, HOUSING_Y)
assert.ok(Math.abs(b1 - 0.93) < 0.02 && Math.abs(b0 - 1.23) < 0.05, `OLS ${b1} ${b0} should match the lesson (0.93x + 1.23)`)
assert.ok(mseOf(HOUSING_X, HOUSING_Y, b1, b0) < mseOf(HOUSING_X, HOUSING_Y, 0.4, 2))
const withOut = ols([...HOUSING_X, 8.5], [...HOUSING_Y, 13.5]); assert.ok(withOut.b1 > b1 + 0.1, 'an outlier tilts the best-fit line')
console.log('OLS', b1.toFixed(2), b0.toFixed(2), '| with outlier slope', withOut.b1.toFixed(2))

const s0 = lloydAt(TWO_GROUPS, 2, 0); assert.equal(s0.labels, null)
const s1 = lloydAt(TWO_GROUPS, 2, 1); assert.equal(s1.labels.length, 16)
const done = converged(TWO_GROUPS, 2); assert.ok(done.sse < 14 && done.sse > 12, `two-group SSE ${done.sse}`)
const hist = lloydAt(TWO_GROUPS, 2, 9).history; assert.ok(hist.every((v, i) => i === 0 || v <= hist[i - 1] + 1e-9), 'cost never rises')
const sse = [1, 2, 3, 4, 5].map((k) => converged(TWO_GROUPS, k).sse); assert.ok(sse.every((v, i) => i === 0 || v <= sse[i - 1] + 1e-9), 'more clusters, never more cost')
console.log('SSE by K', sse.map((v) => v.toFixed(1)).join(', '))
const ring = converged(RING_POINTS, 2); const half = ring.labels.filter((l) => l === 0).length
console.log('rings: K=2 split', half, '/', 60 - half, '(not inner vs outer ring: 30/30 by radius would be right)')

assert.ok(Math.abs(bowlAt(0.3, 0) - -0.5) < 1e-12)
assert.ok(bowlJ(bowlAt(0.3, 15)) < 1e-6, 'lr 0.3 converges')
assert.ok(bowlJ(bowlAt(1.1, 10)) > bowlJ(bowlAt(1.1, 0)), 'lr 1.1 diverges')
assert.ok(Math.abs(bowlAt(0.05, 15) - 3) > 0.3, 'lr 0.05 is slow')
assert.equal(bowlGrad(3), 0)
console.log('theory maths: all checks passed')
