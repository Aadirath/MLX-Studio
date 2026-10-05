function TeacherPlaybackControls({
  currentStep,
  totalSteps,
  stepLabels = [],
  isPlaying = false,
  speed = 1,
  canPrev = true,
  canNext = true,
  onReset,
  onPrev,
  onNext,
  onTogglePlay,
  onJumpStep,
  onSpeedChange,
}) {
  return (
    <>
      {/* Primary Action Buttons */}
      <div className="tw-pb-buttons">
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)', marginRight: 6 }}>
          Step {currentStep + 1}/{totalSteps}
        </span>
        <button
          type="button"
          className="tw-pb-btn"
          onClick={onReset}
          title="Reset simulation to initial state"
        >
          <span>⟲</span> Reset
        </button>

        <button
          type="button"
          className="tw-pb-btn"
          onClick={onPrev}
          disabled={!canPrev || isPlaying}
          title="Go to previous step"
        >
          <span>‹</span> Prev
        </button>

        <button
          type="button"
          className="tw-pb-btn primary"
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause auto-play' : 'Play step-by-step animation'}
        >
          {isPlaying ? (
            <>
              <span>❚❚</span> Pause
            </>
          ) : (
            <>
              <span>▶</span> Play
            </>
          )}
        </button>

        <button
          type="button"
          className="tw-pb-btn"
          onClick={onNext}
          disabled={!canNext || isPlaying}
          title="Advance to next step"
        >
          Next <span>›</span>
        </button>
      </div>

      {/* Step Pills Timeline */}
      <div className="tw-pb-stepper">
        {stepLabels.map((lbl, idx) => {
          const isActive = idx === currentStep
          const isPassed = idx < currentStep
          return (
            <button
              type="button"
              key={idx}
              className={`tw-step-pill ${isActive ? 'active' : ''} ${isPassed ? 'passed' : ''}`}
              onClick={() => onJumpStep?.(idx)}
              disabled={isPlaying}
              title={`Jump to ${lbl}`}
            >
              {lbl}
            </button>
          )
        })}
      </div>

      {/* Speed Controls */}
      <div className="tw-speed-selector">
        <span style={{ fontSize: '11px', color: 'var(--muted)', marginRight: 4 }}>Speed:</span>
        {[0.5, 1, 2].map((s) => (
          <button
            type="button"
            key={s}
            className={`tw-btn-chip ${speed === s ? 'active' : ''}`}
            onClick={() => onSpeedChange?.(s)}
            style={{ padding: '2px 7px', fontSize: '11px' }}
          >
            {s}x
          </button>
        ))}
      </div>
    </>
  )
}

export default TeacherPlaybackControls
