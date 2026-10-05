function TeacherPlaybackControls({
  isPlaying = false,
  speed = 1,
  canPrev = true,
  canNext = true,
  onReset,
  onPrev,
  onNext,
  onTogglePlay,
  onSpeedChange,
  nextLabel = 'Next Iteration',
  prevLabel = 'Prev',
  onStep,
  canStep = false,
  stepLabel = 'Fine Step',
  isPresentationMode = false,
  statusPill = null,
}) {
  return (
    <div className={`tw-pb-bar ${isPresentationMode ? 'presentation' : ''}`}>
      {/* Primary Playback Buttons (Big, high-contrast, projector-ready) */}
      <div className="tw-pb-buttons">
        <button
          type="button"
          className="tw-pb-btn tw-pb-btn-reset"
          onClick={onReset}
          title="Reset simulation to initial state (Shortcut: R)"
        >
          <span className="tw-pb-ico">⟲</span>
          <span>Reset</span>
        </button>

        {canPrev !== false && (
          <button
            type="button"
            className="tw-pb-btn"
            onClick={onPrev}
            disabled={!canPrev || isPlaying}
            title="Step back one iteration (Shortcut: ←)"
          >
            <span className="tw-pb-ico">⏮</span>
            <span>{prevLabel}</span>
          </button>
        )}

        <button
          type="button"
          className="tw-pb-btn tw-pb-btn-play primary"
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause simulation (Shortcut: Space)' : 'Play simulation automatically (Shortcut: Space)'}
        >
          {isPlaying ? (
            <>
              <span className="tw-pb-ico">❚❚</span>
              <span>Pause</span>
            </>
          ) : (
            <>
              <span className="tw-pb-ico">▶</span>
              <span>Play</span>
            </>
          )}
        </button>

        <button
          type="button"
          className="tw-pb-btn tw-pb-btn-next"
          onClick={onNext}
          disabled={!canNext || isPlaying}
          title="Advance one full iteration (Shortcut: →)"
        >
          <span>{nextLabel}</span>
          <span className="tw-pb-ico">⏭</span>
        </button>

        {/* Optional fine-grain step button if teacher wants to dissect an internal step */}
        {canStep && onStep && (
          <button
            type="button"
            className="tw-pb-btn tw-pb-btn-substep"
            onClick={onStep}
            disabled={isPlaying}
            title="Step into individual sub-step"
          >
            <span>{stepLabel}</span>
            <span className="tw-pb-ico">❯</span>
          </button>
        )}
      </div>

      {/* Center status pill (visible especially in presentation mode) */}
      {statusPill && <div className="tw-pb-status-pill">{statusPill}</div>}

      {/* Right Controls: Speed & Shortcut Helper */}
      <div className="tw-pb-right">
        <div className="tw-speed-selector">
          <span className="tw-pb-meta-label">Speed:</span>
          {[0.5, 1, 2].map((s) => (
            <button
              type="button"
              key={s}
              className={`tw-btn-chip ${speed === s ? 'active' : ''}`}
              onClick={() => onSpeedChange?.(s)}
            >
              {s}x
            </button>
          ))}
        </div>

        <div className="tw-keyboard-hint" title="Keyboard shortcuts for presentation">
          <code>Space</code> Play · <code>→</code> Next · <code>R</code> Reset
        </div>
      </div>
    </div>
  )
}

export default TeacherPlaybackControls
