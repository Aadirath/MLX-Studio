import './TeacherExplanationPanel.css'

function TeacherExplanationPanel({
  stepNumber,
  totalSteps,
  stepTitle,
  whatIsHappening,
  whyItMatters,
  metrics = [],
  talkingPoint,
}) {
  return (
    <div className="tw-panel">
      {/* Header */}
      <div className="tw-panel-step-header">
        <span className="tw-panel-step-num">
          Step {stepNumber} of {totalSteps}
        </span>
        <h3 className="tw-panel-step-title">{stepTitle}</h3>
      </div>

      {/* What is happening? */}
      <div className="tw-panel-section">
        <h4 className="tw-panel-heading">What is happening?</h4>
        <div className="tw-panel-box">
          <p className="tw-panel-text">{whatIsHappening}</p>
        </div>
      </div>

      {/* Why? */}
      <div className="tw-panel-section">
        <h4 className="tw-panel-heading">Why?</h4>
        <div className="tw-panel-box highlight">
          <p className="tw-panel-text">{whyItMatters}</p>
        </div>
      </div>

      {/* Metrics & Current Values */}
      {metrics && metrics.length > 0 && (
        <div className="tw-panel-section">
          <h4 className="tw-panel-heading">Current Values & Metrics</h4>
          <div className="tw-panel-metrics">
            {metrics.map((m, idx) => (
              <div className="tw-metric-card" key={idx}>
                <span className="tw-metric-label">{m.label}</span>
                <span className={`tw-metric-val ${m.status || ''}`}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teacher Talking Point */}
      {talkingPoint && (
        <div className="tw-panel-tip">
          <div className="tw-tip-title">💡 Classroom Prompt</div>
          <div>{talkingPoint}</div>
        </div>
      )}
    </div>
  )
}

export default TeacherExplanationPanel
