// Tiny helper for the Supabase REST API (PostgREST). No extra npm package is needed.
// Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel. The key stays on the server.

// Accepts the project URL however it was pasted: with quotes, spaces, a trailing slash or a /rest/v1 suffix.
function baseUrl() {
  return String(process.env.SUPABASE_URL || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/\/rest\/v1\/?$/, '')
    .replace(/\/+$/, '')
}export function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function headers(extra = {}) {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const h = { apikey: key, 'Content-Type': 'application/json', ...extra }
  // Legacy keys are JWTs and also go in the Authorization header. New secret keys go in apikey only.
  if (key.startsWith('eyJ')) h.Authorization = `Bearer ${key}`
  return h
}

export async function insertEvent(row) {
    const url = `${baseUrl()}/rest/v1/events`
  const response = await fetch(url, {
    method: 'POST',
    headers: headers({ Prefer: 'return=minimal' }),
    body: JSON.stringify(row),
    signal: AbortSignal.timeout(6000),
  })
  if (!response.ok) throw new Error(`Supabase insert failed: ${response.status} ${await response.text()}`)
}

export async function recentEvents(limit = 3000) {
    const url = `${baseUrl()}/rest/v1/events?select=sid,type,topic,data,created_at&order=created_at.desc&limit=${limit}`
  const response = await fetch(url, { headers: headers(), signal: AbortSignal.timeout(8000) })
  if (!response.ok) throw new Error(`Supabase read failed: ${response.status} ${await response.text()}`)
  return response.json()
}
