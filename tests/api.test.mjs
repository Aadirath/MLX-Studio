import assert from 'node:assert/strict'
import login from '../api/teacher-login.js'
import session from '../api/teacher-session.js'
import log from '../api/log.js'
import insights, { summarise } from '../api/insights.js'

function mk(method, { body, headers = {} } = {}) {
  const res = { statusCode: 200, headers: {}, body: undefined,
    setHeader(k, v) { this.headers[k.toLowerCase()] = v }, status(c) { this.statusCode = c; return this }, json(o) { this.body = o; return this } }
  return [{ method, body, headers }, res]
}

// ---- teacher gate ----
delete process.env.TEACHER_PASSCODE
{ const [q, r] = mk('POST', { body: { passcode: 'x' } }); await login(q, r); assert.equal(r.statusCode, 503, 'no passcode configured must refuse') }
{ const [q, r] = mk('GET'); session(q, r); assert.deepEqual(r.body, { ok: false, configured: false }) }

process.env.TEACHER_PASSCODE = 'class-2026'
{ const [q, r] = mk('POST', { body: { passcode: 'wrong' } }); const t = Date.now(); await login(q, r)
  assert.equal(r.statusCode, 401); assert.ok(Date.now() - t >= 700, 'wrong guesses are slowed') }
let cookie
{ const [q, r] = mk('POST', { body: { passcode: 'class-2026' } }); await login(q, r)
  assert.equal(r.statusCode, 200); cookie = r.headers['set-cookie']
  assert.match(cookie, /HttpOnly/); assert.match(cookie, /Secure/); assert.match(cookie, /SameSite=Lax/); assert.ok(!cookie.includes('class-2026'), 'passcode never in the cookie') }
const asTeacher = { cookie: cookie.split(';')[0] }
{ const [q, r] = mk('GET', { headers: asTeacher }); session(q, r); assert.equal(r.body.ok, true) }
{ const [q, r] = mk('GET', { headers: { cookie: 'mlx_teacher=9999999999.deadbeef' } }); session(q, r); assert.equal(r.body.ok, false, 'forged token rejected') }
{ const [q, r] = mk('GET', { headers: { cookie: 'mlx_teacher=1.' + cookie.split('.')[1] } }); session(q, r); assert.equal(r.body.ok, false, 'expired token rejected') }
{ const [q, r] = mk('DELETE'); session(q, r); assert.match(r.headers['set-cookie'], /Max-Age=0/) }
{ const [q, r] = mk('GET'); await insights(q, r); assert.equal(r.statusCode, 401, 'insights need the teacher cookie') }

// ---- log validation (no database configured: accepted and dropped) ----
const good = { sid: 'abcd1234-ef', type: 'experiment', topic: 'k-means', data: { text: 'K=3' } }
{ const [q, r] = mk('POST', { body: good }); await log(q, r); assert.equal(r.statusCode, 202); assert.equal(r.body.stored, false) }
for (const bad of [{ ...good, sid: 'x' }, { ...good, type: 'drop table' }, { ...good, topic: 'secrets' }]) {
  const [q, r] = mk('POST', { body: bad }); await log(q, r); assert.equal(r.statusCode, 400)
}
{ const [q, r] = mk('GET'); await log(q, r); assert.equal(r.statusCode, 405) }

// ---- insights maths ----
const rows = [ // newest first
  { sid: 'a', topic: 'gradient-descent', type: 'posttest_done', data: { correct: 5, total: 6, sameCorrect: 4, sameTotal: 5 } },
  { sid: 'a', topic: 'gradient-descent', type: 'pretest_done', data: { correct: 2, total: 5, missed: ['Learning rate', 'Convergence', 'Learning rate'] } },
  { sid: 'b', topic: 'gradient-descent', type: 'pretest_done', data: { correct: 3, total: 5, missed: ['Learning rate'] } },
  { sid: 'b', topic: 'gradient-descent', type: 'coach_question', data: { q: 'why does it zigzag', lang: 'hi' } },
  { sid: 'b', topic: 'k-means', type: 'experiment', data: { text: 'K=3' } },
  { sid: 'b', topic: 'teacher', type: 'code_run', data: { ok: false } },
]
const s = summarise(rows)
assert.equal(s.sessions, 2); assert.equal(s.coachQuestions, 1); assert.equal(s.codeErrors, 1)
const gd = s.assessments['gradient-descent']
assert.equal(gd.pretests, 2); assert.equal(gd.avgPre, 50); assert.equal(gd.posttests, 1)
assert.equal(gd.avgGain, 40, 'a: pre 40% -> same-questions post 80%'); assert.equal(gd.paired, 1)
assert.equal(s.mostMissed[0].concept, 'Learning rate')
console.log('API logic: all checks passed'); console.log(JSON.stringify({ gd, mostMissed: s.mostMissed }))
