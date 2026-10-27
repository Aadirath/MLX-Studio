import { useEffect, useRef, useState } from 'react'
import BowlVisual from './BowlVisual.jsx'
import ClusterVisual from './ClusterVisual.jsx'
import LineVisual from './LineVisual.jsx'
import './theory.css'

const VISUALS = {
  'linear-regression': { Visual: LineVisual, title: 'Try it: the line and its error' },
  'k-means': { Visual: ClusterVisual, title: 'Try it: points, centres and clusters' },
  'gradient-descent': { Visual: BowlVisual, title: 'Try it: a ball rolling downhill' },
}

// The theory text on the left, a live picture on the right. The picture follows the block you are reading,
// or the block you press "Show on the picture" for.
function TheorySplit({ topicId, blocks }) {
  const [active, setActive] = useState(0)
  const blockRefs = useRef([])
  const pictureRef = useRef(null)
  const entry = VISUALS[topicId]

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting)
        if (hit) setActive(Number(hit.target.dataset.block))
      },
      { rootMargin: '-25% 0px -60% 0px' },
    )
    blockRefs.current.forEach((el) => el && observer.observe(el))
    return () => observer.disconnect()
  }, [blocks.length])

  function show(i) {
    setActive(i)
    // On a narrow screen the picture sits above the text, so bring it into view.
    if (typeof window !== 'undefined' && window.matchMedia?.('(max-width: 900px)').matches) {
      pictureRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    }
  }

  const body = blocks.map((block, i) => (
    <section
      className={`theoryBlock${i === active ? ' theoryBlock--active' : ''}`}
      key={block.heading}
      data-block={i}
      ref={(el) => {
        blockRefs.current[i] = el
      }}
    >
      <h2>{block.heading}</h2>
      {block.text && <p>{block.text}</p>}
      {block.list && (
        <ul>
          {block.list.map((li) => (
            <li key={li}>{li}</li>
          ))}
        </ul>
      )}
      {block.formula && <div className="theoryFormula">{block.formula}</div>}
      {block.note && <p className="theoryNote">{block.note}</p>}
      {entry && (
        <button type="button" className="theoryShow" aria-pressed={i === active} onClick={() => show(i)}>
          {i === active ? 'Showing on the picture' : 'Show on the picture'}
        </button>
      )}
    </section>
  ))

  if (!entry) return <div>{body}</div>
  const { Visual, title } = entry
  return (
    <div className="theoryGrid">
      <aside className="theoryVisual" ref={pictureRef} aria-label="Interactive picture for the theory">
        <p className="tvTitle">{title}</p>
        <p className="tvBlockName">{blocks[active].heading}</p>
        <Visual focus={active} />
      </aside>
      <div className="theoryText">{body}</div>
    </div>
  )
}

export default TheorySplit
