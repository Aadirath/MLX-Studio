// Vercel serverless function: /api/hint.js
// Uses Gemini's free API tier (no billing required for gemini-2.5-flash).
// The API key lives only here, set in Vercel's environment settings.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  const { topic, stateDescription, question } = req.body || {};

  if (!topic || !question) {
    return res.status(400).json({ error: 'topic and question are required' });
  }

  const safeQuestion = String(question).slice(0, 500);
  const safeState = String(stateDescription || '').slice(0, 800);

  const systemPrompt = `You are a scaffolding tutor inside MLX Studio, an interactive ML learning app.
The student is working on: ${topic}.
Current simulation state: ${safeState || 'not provided'}.

Rules, these are not optional:
- Never give the direct final answer immediately.
- Give a hint, a guiding question, or point at what to look at on screen.
- Keep it to 2-3 short sentences.
- If the student seems genuinely stuck after context suggests repeated asking, you may be a little more direct, but still explain the reasoning, not just the answer.`;

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY, // set in Vercel project settings, never in code
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: 'user', parts: [{ text: safeQuestion }] }],
          generationConfig: { maxOutputTokens: 200 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', errText);
      // 429 specifically means the free tier's rate limit was hit, worth
      // telling the user that plainly rather than a generic failure.
      if (response.status === 429) {
        return res.status(429).json({ error: 'Hit the free tier rate limit, try again in a moment.' });
      }
      return res.status(502).json({ error: 'The AI service did not respond. Try again in a moment.' });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I could not generate a hint just now.';

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Hint endpoint failed:', err);
    return res.status(500).json({ error: 'The AI service is unavailable right now.' });
  }
}
