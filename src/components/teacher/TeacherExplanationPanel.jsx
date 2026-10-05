import { useState } from 'react'
import './TeacherExplanationPanel.css'

function TeacherExplanationPanel({
  stepNumber,
  totalSteps,
  stepTitle,
  shortSummary,
  whatIsHappening,
  whyItMatters,
  metrics = [],
  talkingPoint,
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div>
      {/* Compact Status Bar (always visible) */}
      <div className="tw-compact-status-bar">
        <div className="tw-status-left">
          <span className="tw-status-badge">
            Step {stepNumber}{totalSteps ? `/${totalSteps}` : ''}
          </span>
          <span className="tw-status-text">{stepTitle}</span>
          {shortSummary && <span className="tw-status-sub">— {shortSummary}</span>}
        </div>

        <div className="tw-status-right">
          {/* Quick Metrics (visible without expanding) */}
          {metrics.slice(0, 3).map((m, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '11.5px',
                color: 'var(--ink)',
                background: 'var(--paper)',
                padding: '2px 7px',
                borderRadius: '4px',
                border: '1px solid var(--line)',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              <span style={{ color: 'var(--muted)' }}>{m.label}: </span>
              <b>{m.value}</b>
            </span>
          ))}

          {/* Toggle Explain This Step */}
          <button
            type="button"
            className={`tw-explain-toggle-btn ${isExpanded ? 'active' : ''}`}
            onClick={() => setIsExpanded((prev) => !prev)}
            title="Toggle deeper explanation and teaching notes"
          >
            <span>💡</span> {isExpanded ? 'Hide explanation ▴' : 'Explain this step ▾'}
          </button>
        </div>
      </div>

      {/* Expandable Deep Explanation Drawer */}
      {isExpanded && (
        <div className="tw-expanded-drawer">
          <div className="tw-drawer-section">
            <h5 className="tw-drawer-heading">What is happening?</h5>
            <div className="tw-drawer-box">{whatIsHappening}</div>
          </div>

          <div className="tw-drawer-section">
            <h5 className="tw-drawer-heading">Why?</h5>
            <div className="tw-drawer-box highlight">{whyItMatters}</div>
          </div>

          {talkingPoint && (
            <div className="tw-drawer-tip">
              <b>💬 Classroom Discussion Prompt:</b> {talkingPoint}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TeacherExplanationPanel
