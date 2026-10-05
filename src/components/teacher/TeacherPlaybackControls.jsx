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
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', flexWrap: 'wrap', gap: 10 }}>
      {/* Clear simple primary controls: [ Reset ] [ ◀ Step ] [ ▶ Play / ❚❚ Pause ] [ Step ▶ ] */}
      <div className="tw-pb-buttons">
        <button
          type="button"
          className="tw-pb-btn"
          onClick={onReset}
          title="Reset to initial state"
        >
          <span>⟲</span> Reset
        </button>

        {canPrev !== false && (
          <button
            type="button"
            className="tw-pb-btn"
            onClick={onPrev}
            disabled={!canPrev || isPlaying}
            title="Step backward"
          >
            <span>◀</span> Step
          </button>
        )}

        <button
          type="button"
          className="tw-pb-btn primary"
          onClick={onTogglePlay}
          title={isPlaying ? 'Pause simulation' : 'Play simulation'}
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
          title="Step forward"
        >
          Step <span>▶</span>
        </button>
      </div>

      {/* Animation Speed Selector */}
      <div className="tw-speed-selector">
        <span style={{ fontSize: '11px', color: 'var(--muted)', marginRight: 4 }}>Speed:</span>
        {[0.5, 1, 2].map((s) => (
          <button
            type="button"
            key={s}
            className={`tw-btn-chip ${speed === s ? 'active' : ''}`}
            onClick={() => onSpeedChange?.(s)}
            style={{ padding: '2px 8px', fontSize: '11px' }}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  )
}

export default TeacherPlaybackControls
