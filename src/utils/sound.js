// Small Web Audio helper for the optional "Hear the error" mode.
// Nothing here may break a lesson, so every call is wrapped in try/catch.

const PEAK_GAIN = 0.08
const STEP_SECONDS = 0.35 // shorter than the 650 ms step interval
const RESOLVE_SECONDS = 0.25
const FADE = 0.03
const MAX_FREQ = 1500

export function createSonifier() {
  let ctx = null
  let busyUntil = 0

  // Created lazily, so only a call that comes from a user action ever makes the context.
  function getContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (!AudioCtx) return null
      ctx = new AudioCtx()
      busyUntil = 0
    }
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }

  function tone(c, freq, pan, start, seconds) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    const end = start + seconds
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(PEAK_GAIN, start + FADE)
    gain.gain.setValueAtTime(PEAK_GAIN, end - FADE)
    gain.gain.linearRampToValueAtTime(0, end)
    osc.connect(gain)
    if (typeof c.createStereoPanner === 'function') {
      const panner = c.createStereoPanner()
      panner.pan.value = Math.max(-1, Math.min(1, Number.isFinite(pan) ? pan : 0))
      gain.connect(panner)
      panner.connect(c.destination)
    } else {
      gain.connect(c.destination)
    }
    osc.start(start)
    osc.stop(end)
    return end
  }

  function playStep({ freq, pan = 0 } = {}) {
    try {
      const c = getContext()
      if (!c || !Number.isFinite(freq)) return
      const start = Math.max(c.currentTime, busyUntil)
      busyUntil = tone(c, Math.min(MAX_FREQ, freq), pan, start, STEP_SECONDS)
    } catch {
      // sound is optional: ignore any audio failure
    }
  }

  // Two rising notes, queued after any tone that is still playing.
  function playResolve() {
    try {
      const c = getContext()
      if (!c) return
      const start = Math.max(c.currentTime, busyUntil)
      tone(c, 196, 0, start, RESOLVE_SECONDS)
      busyUntil = tone(c, 294, 0, start + RESOLVE_SECONDS, RESOLVE_SECONDS)
    } catch {
      // sound is optional: ignore any audio failure
    }
  }

  function close() {
    try {
      if (ctx) ctx.close()
    } catch {
      // already closed
    }
    ctx = null
    busyUntil = 0
  }

  return { playStep, playResolve, close }
}
