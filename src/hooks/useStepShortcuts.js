import { useEffect, useRef } from 'react'

const TYPING_TAGS = ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON']

// Space takes a step and R resets, but only while nothing that uses those keys has focus.
export function useStepShortcuts({ onStep, onReset, enabled = true }) {
  const handlers = useRef({ onStep, onReset })
  useEffect(() => {
    handlers.current = { onStep, onReset }
  })

  useEffect(() => {
    if (!enabled) return undefined
    const onKey = (e) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      const el = document.activeElement
      if (el && (TYPING_TAGS.includes(el.tagName) || el.isContentEditable)) return
      if (e.code === 'Space') {
        e.preventDefault()
        handlers.current.onStep?.()
      } else if (e.key === 'r' || e.key === 'R') {
        handlers.current.onReset?.()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [enabled])
}
