// GET    /api/teacher-session  -> { ok, configured }   (is this browser unlocked?)
// DELETE /api/teacher-session  -> locks teacher mode again
import { clearedCookie, isConfigured, isTeacher } from './_teacherAuth.js'

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearedCookie())
    return res.status(200).json({ ok: false })
  }
  if (req.method !== 'GET') return res.status(405).json({ error: 'Use GET or DELETE' })
  return res.status(200).json({ ok: isTeacher(req), configured: isConfigured() })
}
