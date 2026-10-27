// POST /api/teacher-login  { passcode }  -> sets the teacher cookie when the passcode is right.
import { isConfigured, makeToken, passcodeMatches, sessionCookie } from './_teacherAuth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' })
  if (!isConfigured()) {
    return res.status(503).json({ error: 'Teacher mode has no passcode set yet. Set TEACHER_PASSCODE in Vercel.' })
  }
  const passcode = typeof req.body?.passcode === 'string' ? req.body.passcode.slice(0, 200) : ''
  if (!passcodeMatches(passcode)) {
    // A short pause makes guessing slow without any extra infrastructure.
    await new Promise((resolve) => setTimeout(resolve, 800))
    return res.status(401).json({ error: 'That passcode is not right.' })
  }
  res.setHeader('Set-Cookie', sessionCookie(makeToken()))
  return res.status(200).json({ ok: true })
}
