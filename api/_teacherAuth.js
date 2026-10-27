// Shared helpers for the teacher passcode. Files that start with an underscore are not exposed as routes.
//
// How it works: the teacher enters the class passcode once. The server checks it against the
// TEACHER_PASSCODE environment variable and, if it matches, sets a signed, HttpOnly cookie that
// lasts eight hours. The passcode itself is never stored in the browser or in the code.
import crypto from 'node:crypto'

const COOKIE = 'mlx_teacher'
const MAX_AGE_SECONDS = 60 * 60 * 8

function secret() {
  return process.env.TEACHER_SECRET || process.env.TEACHER_PASSCODE || ''
}

function sign(expiry) {
  return crypto.createHmac('sha256', secret()).update(`teacher.${expiry}`).digest('hex')
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest()
  const hb = crypto.createHash('sha256').update(String(b)).digest()
  return crypto.timingSafeEqual(ha, hb)
}

export function isConfigured() {
  return Boolean(process.env.TEACHER_PASSCODE)
}

export function passcodeMatches(input) {
  return isConfigured() && safeEqual(input ?? '', process.env.TEACHER_PASSCODE)
}

export function makeToken() {
  const expiry = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS
  return `${expiry}.${sign(expiry)}`
}

function readCookie(req, name) {
  const header = req.headers?.cookie || ''
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('='))
  }
  return ''
}

export function isTeacher(req) {
  if (!isConfigured()) return false
  const token = readCookie(req, COOKIE)
  const [expiry, mac] = token.split('.')
  if (!expiry || !mac || Number(expiry) < Math.floor(Date.now() / 1000)) return false
  return safeEqual(mac, sign(expiry))
}

export function sessionCookie(token) {
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}`
}

export function clearedCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
}
