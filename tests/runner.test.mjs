import assert from 'node:assert/strict'
import { executeSandboxed, RUN_TEMPLATES, SANDBOX_DATA, applyBug } from '../src/components/teacher/codeRunner.js'

const finite = (xs) => xs.every(Number.isFinite)
const run = (code) => executeSandboxed(code, SANDBOX_DATA)

for (const [key, t] of Object.entries(RUN_TEMPLATES)) {
  console.log(`\n=== ${key}`)
  const good = run(t.code)
  assert.ok(good.ok, `${key} correct code must run: ${good.message}`)
  const series = good.result[t.series]
  assert.ok(finite(series), 'correct run is finite')
  assert.ok(series[series.length - 1] < series[0], `${key}: loss falls in the correct run (${series[0].toFixed(3)} -> ${series[series.length - 1].toFixed(4)})`)
  console.log(`correct: ${series[0].toFixed(3)} -> ${series[series.length - 1].toFixed(4)} in ${series.length} steps`)

  for (const bug of t.bugs) {
    const code = applyBug(t, bug.id, t.code)
    assert.ok(code, `${key}/${bug.id}: bug applies to the correct code`)
    if (bug.id === 'loop') { console.log('loop    : (needs the worker timeout; checked separately)'); continue }
    const r = run(code)
    let verdict
    if (!r.ok) verdict = `ERROR  ${r.name}: ${r.message}  [line ${r.line}]  -> "${code.split('\n')[r.line - 1]?.trim()}"`
    else {
      const s = r.result[t.series]
      verdict = `runs    ${series.length === s.length ? '' : '(len differs) '}first ${Number(s[0]).toFixed(3)} last ${Number(s[s.length - 1]).toExponential(2)}${finite(s) ? '' : '  NON-FINITE'}`
      if (bug.id === 'still') assert.ok(s[s.length-1] > good.result[t.series].at(-1) * 1.5, 'centres that never move leave the cost well above the correct run')
      else if (['sign','rate','scale','farthest'].includes(bug.id)) assert.ok(!finite(s) || s[s.length - 1] > s[0] || s[s.length-1] > good.result[t.series][good.result[t.series].length-1] * 5, `${key}/${bug.id} should visibly go wrong`)
    }
    console.log(bug.id.padEnd(8) + ': ' + verdict)
    if (['typo'].includes(bug.id)) { assert.equal(r.ok, false); assert.match(r.message, /not defined/); assert.ok(r.line > 1, 'error line reported') }
    if (bug.id === 'bigk') assert.equal(r.ok, false)
  }
}
// syntax error and wrong return
const syn = run('const a = (1 + ')
assert.equal(syn.ok, false); assert.equal(syn.kind, 'syntax'); console.log('\nsyntax error ->', syn.name, '|', syn.message)
assert.equal(run('return 5').ok, false)
// the exact line number points at the user's line, not the wrapper
const t3 = run('const a = 1\nconst b = 2\nthrow new Error("boom")')
assert.equal(t3.line, 3); console.log('line number of a throw on user line 3 ->', t3.line)
console.log('\nrunner: all checks passed')

// ---- the real worker path (Node worker_threads stands in for the browser Worker) ----
import { Worker } from 'node:worker_threads'
import { WORKER_SOURCE } from '../src/components/teacher/codeRunner.js'
const shim = `const { parentPort } = require('node:worker_threads'); const self = { postMessage: (m) => parentPort.postMessage(m) };
${WORKER_SOURCE}
parentPort.on('message', (data) => self.onmessage({ data }));`
function viaWorker(code, ms = 2000) {
  return new Promise((resolve) => {
    const w = new Worker(shim, { eval: true }); const t0 = Date.now()
    const timer = setTimeout(() => { w.terminate(); resolve({ timedOut: true, ms: Date.now() - t0 }) }, ms)
    w.on('message', (m) => { clearTimeout(timer); w.terminate(); resolve({ ...m, ms: Date.now() - t0 }) })
    w.postMessage({ code, data: SANDBOX_DATA })
  })
}
const gdt = RUN_TEMPLATES['gradient-descent']
const okRun = await viaWorker(gdt.code); assert.ok(okRun.ok && okRun.result.losses.length === 30); console.log('worker, correct code: ok in', okRun.ms, 'ms')
const errRun = await viaWorker(applyBug(gdt, 'typo', gdt.code)); assert.equal(errRun.ok, false); assert.equal(errRun.line, 19); console.log('worker, typo: ', errRun.message, '| line', errRun.line)
const loopRun = await viaWorker(applyBug(gdt, 'loop', gdt.code)); assert.ok(loopRun.timedOut && loopRun.ms >= 1900 && loopRun.ms < 3500); console.log('worker, endless loop: stopped after', loopRun.ms, 'ms (page stays alive)')
const km = RUN_TEMPLATES['k-means']; const still = run(applyBug(km, 'still', km.code)).result.sse; console.log('k-means "centres never move": cost stays', still[0].toFixed(2), '->', still[still.length-1].toFixed(2))
console.log('worker path: all checks passed')
