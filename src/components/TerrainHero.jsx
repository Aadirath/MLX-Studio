import { useEffect, useRef } from 'react'
import { gradEllipse, ramp, resolveColor, rgba } from '../utils/terrain.js'

const TH = -0.5
const LEVELS = [1.5, 1, 0.72, 0.5, 0.34, 0.22, 0.13, 0.07, 0.03]
const STEP_MS = 110

function TerrainHero() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return undefined
    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let dpr = 1
    let W = 0
    let cx = 0
    let cy = 0
    let A = 0
    let B = 0
    let bg = null
    let parts = []
    let raf = 0
    let visible = true
    let last = 0
    let ink = [233, 238, 251]

    const readInk = () => {
      const css = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()
      if (css) ink = resolveColor(ctx, css, ink)
    }

    const buildBg = () => {
      if (!W) return
      bg = document.createElement('canvas')
      bg.width = canvas.width
      bg.height = canvas.height
      const c = bg.getContext('2d')
      c.scale(dpr, dpr)
      c.translate(cx, cy)
      c.rotate(TH)
      LEVELS.forEach((l) => {
        const r = Math.min(1, Math.sqrt(l))
        c.beginPath()
        c.ellipse(0, 0, A * Math.sqrt(l), B * Math.sqrt(l), 0, 0, Math.PI * 2)
        c.fillStyle = rgba(ramp(1 - r * 0.98), Math.min(0.9, 0.06 + 0.8 * (1 - r)))
        c.fill()
        c.lineWidth = 1
        c.strokeStyle = rgba(ink, 0.14)
        c.stroke()
      })
    }

    function spawn(i) {
      const a = Math.random() * Math.PI * 2
      const rr = 1.25 + Math.random() * 0.25
      const x = Math.cos(a) * A * rr
      const y = Math.sin(a) * B * rr * 1.4
      const c = Math.cos(TH)
      const s = Math.sin(TH)
      return {
        x: cx + x * c - y * s,
        y: cy + x * s + y * c,
        trail: [],
        k: (0.46 + Math.random() * 0.16) * B * B,
        acc: 0,
        stage: 'run',
        hold: 0,
        alpha: 1,
        delay: i * 600,
      }
    }

    const advance = (p) => {
      p.trail.push([p.x, p.y])
      const g = gradEllipse(p.x, p.y, cx, cy, A, B, TH)
      p.x -= p.k * g[0]
      p.y -= p.k * g[1]
      const dx = p.x - cx
      const dy = p.y - cy
      const u = dx * Math.cos(TH) + dy * Math.sin(TH)
      const v = -dx * Math.sin(TH) + dy * Math.cos(TH)
      if ((Math.abs(u) < 2 && Math.abs(v) < 2) || p.trail.length > 30) {
        p.trail.push([p.x, p.y])
        p.stage = 'hold'
      }
    }

    const drawParticle = (p) => {
      const pts = p.trail.slice()
      if (p.stage === 'run') {
        const f = Math.min(1, p.acc / STEP_MS)
        const q = pts[pts.length - 1]
        if (q) pts.push([q[0] + (p.x - q[0]) * f, q[1] + (p.y - q[1]) * f])
      }
      if (pts.length < 2) return
      ctx.globalAlpha = p.alpha
      ctx.lineJoin = 'round'
      ctx.beginPath()
      pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])))
      ctx.lineWidth = 4
      ctx.strokeStyle = 'rgba(8,12,30,.55)'
      ctx.stroke()
      ctx.beginPath()
      pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])))
      ctx.lineWidth = 1.8
      ctx.strokeStyle = 'rgba(255,255,255,.92)'
      ctx.stroke()
      ctx.fillStyle = '#fff'
      pts.forEach((q) => {
        ctx.beginPath()
        ctx.arc(q[0], q[1], 2.2, 0, Math.PI * 2)
        ctx.fill()
      })
      const h = pts[pts.length - 1]
      ctx.beginPath()
      ctx.arc(h[0], h[1], 4.6, 0, Math.PI * 2)
      ctx.fillStyle = '#FDE725'
      ctx.fill()
      ctx.lineWidth = 1.5
      ctx.strokeStyle = 'rgba(8,12,30,.9)'
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    const drawStar = (r) => {
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const rr = i % 2 ? r * 0.45 : r
        const a = -Math.PI / 2 + (i * Math.PI) / 5
        const x = cx + rr * Math.cos(a)
        const y = cy + rr * Math.sin(a)
        if (i) ctx.lineTo(x, y)
        else ctx.moveTo(x, y)
      }
      ctx.closePath()
      ctx.fillStyle = '#FDE725'
      ctx.fill()
      ctx.lineWidth = 1.4
      ctx.strokeStyle = 'rgba(8,12,30,.9)'
      ctx.stroke()
    }

    const paintBase = () => {
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (bg) ctx.drawImage(bg, 0, 0)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const staticFrame = () => {
      paintBase()
      for (let i = 0; i < 5; i++) {
        const p = spawn(0)
        let n = 0
        while (p.stage === 'run' && n++ < 40) advance(p)
        drawParticle(p)
      }
      drawStar(9)
    }

    const frame = (now) => {
      raf = 0
      if (!visible || !W) return
      const dt = Math.min(64, now - (last || now))
      last = now
      paintBase()
      parts.forEach((p) => {
        if (p.delay > 0) {
          p.delay -= dt
          return
        }
        if (p.stage === 'run') {
          p.acc += dt
          if (p.acc >= STEP_MS) {
            p.acc -= STEP_MS
            advance(p)
          }
        } else if (p.stage === 'hold') {
          p.hold += dt
          if (p.hold > 1400) {
            p.stage = 'fade'
            p.hold = 0
          }
        } else {
          p.alpha -= dt / 800
          if (p.alpha <= 0) Object.assign(p, spawn(0))
        }
        drawParticle(p)
      })
      drawStar(9)
      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      if (!raf && visible && !reduceQuery.matches && W) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    }

    const size = () => {
      const r = canvas.getBoundingClientRect()
      if (!r.width || !r.height) return
      dpr = Math.min(2, window.devicePixelRatio || 1)
      W = r.width
      canvas.width = Math.round(r.width * dpr)
      canvas.height = Math.round(r.height * dpr)
      const narrow = W < 820
      cx = W * (narrow ? 0.62 : 0.74)
      cy = r.height * 0.52
      A = W * (narrow ? 0.5 : 0.36)
      B = A / 2.3
      readInk()
      buildBg()
      parts = [0, 1, 2, 3, 4].map(spawn)
      if (reduceQuery.matches) staticFrame()
      else start()
    }

    const onTheme = () => {
      readInk()
      buildBg()
      if (reduceQuery.matches) staticFrame()
    }

    const ro = new ResizeObserver(size)
    ro.observe(canvas)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) start()
    })
    io.observe(canvas)
    const mo = new MutationObserver(onTheme)
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', onTheme)
    size()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      mo.disconnect()
      mq.removeEventListener('change', onTheme)
    }
  }, [])

  return <canvas ref={ref} className="mx-hero__canvas" aria-hidden="true" />
}

export default TerrainHero
