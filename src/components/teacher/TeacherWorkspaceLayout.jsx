import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import './TeacherWorkspaceLayout.css'

const TEACHER_WORKSPACES = [
  { name: 'Linear Regression', path: '/teacher/linear-regression' },
  { name: 'K-Means', path: '/teacher/k-means' },
  { name: 'Gradient Descent', path: '/teacher/gradient-descent' },
]

function TeacherWorkspaceLayout({
  title,
  subtitle,
  datasetSelector,
  visualization,
  parameterControls,
  playbackControls,
  statusExplanation,
  teachingMode = 'visual', // 'visual' | 'code-visual'
  onTeachingModeChange,
  focusMode = 'balanced', // 'diagram' | 'balanced' | 'code'
  onFocusModeChange,
  codePanel,
  onTogglePlay,
  onNext,
  onPrev,
  onReset,
  snapshotBar = null,
}) {
  const [isPresentationMode, setIsPresentationMode] = useState(false)

  // Global Keyboard Shortcuts for Classroom Presentation
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if user is typing in a textarea or input field
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target?.tagName)) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        onTogglePlay?.()
      } else if (e.code === 'ArrowRight') {
        e.preventDefault()
        onNext?.()
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault()
        onPrev?.()
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        onReset?.()
      } else if (e.key === 'Escape' && isPresentationMode) {
        e.preventDefault()
        setIsPresentationMode(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onTogglePlay, onNext, onPrev, onReset, isPresentationMode])

  // ==========================================
  // PRESENTATION MODE (Full Projector Canvas)
  // ==========================================
  if (isPresentationMode) {
    return (
      <div className="tw-presentation-overlay">
        {/* Top Minimal Bar */}
        <div className="tw-pres-header">
          <div className="tw-pres-title-row">
            <span className="tw-pres-badge">📺 Projected Board</span>
            <span className="tw-pres-breadcrumb">Teacher Mode / <b>{title}</b></span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {snapshotBar && <div className="tw-pres-snapshot">{snapshotBar}</div>}
            <button
              type="button"
              className="tw-pres-exit-btn"
              onClick={() => setIsPresentationMode(false)}
              title="Exit presentation mode (Shortcut: Esc)"
            >
              ✕ Exit Presentation (Esc)
            </button>
          </div>
        </div>

        {/* Maximized Visualisation Canvas */}
        <div className="tw-pres-canvas-card">
          {visualization}
        </div>

        {/* Projector-Optimized Bottom Controls Bar */}
        <div className="tw-pres-bottom-dock">
          {parameterControls && (
            <div className="tw-pres-param-strip">{parameterControls}</div>
          )}
          {playbackControls && (
            <div className="tw-pres-pb-strip">{playbackControls}</div>
          )}
        </div>
      </div>
    )
  }

  // ==========================================
  // STANDARD TEACHER WORKSPACE
  // ==========================================
  return (
    <div className="tw-workspace">
      {/* 1. Header & Navigation */}
      <header className="tw-header">
        <div className="tw-nav-row">
          <Link to="/teacher" className="tw-back-link">
            ← Teacher Dashboard
          </Link>
          <div className="tw-tabs">
            {TEACHER_WORKSPACES.map((ws) => (
              <NavLink
                key={ws.path}
                to={ws.path}
                className={({ isActive }) => (isActive ? 'tw-tab-link active' : 'tw-tab-link')}
              >
                {ws.name}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="tw-title-row">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <h1 className="tw-title">{title}</h1>
            <span className="tw-badge">Classroom Teaching Board</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Presentation Mode Button */}
            <button
              type="button"
              className="tw-pres-launch-btn"
              onClick={() => setIsPresentationMode(true)}
              title="Enter full-screen projector presentation mode"
            >
              <span>📺</span> Presentation Mode
            </button>
          </div>
        </div>
        <p className="tw-desc">{subtitle}</p>
      </header>

      {/* 2. Teaching View Switcher Toolbar & Snapshot */}
      <div className="tw-mode-toolbar">
        <div className="tw-mode-group">
          <span className="tw-mode-label">Teaching View:</span>
          <div className="tw-mode-segmented" role="tablist" aria-label="Teaching View">
            <button
              type="button"
              className={`tw-mode-segment ${teachingMode === 'visual' ? 'active' : ''}`}
              onClick={() => onTeachingModeChange?.('visual')}
            >
              <span className="tw-mode-icon">📊</span> Visual
            </button>
            <button
              type="button"
              className={`tw-mode-segment ${teachingMode === 'code-visual' ? 'active' : ''}`}
              onClick={() => onTeachingModeChange?.('code-visual')}
            >
              <span className="tw-mode-icon">💻</span> Code + Visual
            </button>
          </div>
        </div>

        {teachingMode === 'code-visual' && (
          <div className="tw-focus-group">
            <span className="tw-focus-label">Focus:</span>
            <div className="tw-focus-segmented" role="group" aria-label="Split Focus">
              <button
                type="button"
                className={`tw-focus-segment ${focusMode === 'diagram' ? 'active' : ''}`}
                onClick={() => onFocusModeChange?.('diagram')}
                title="Diagram gets more space (65%)"
              >
                Diagram Focus
              </button>
              <button
                type="button"
                className={`tw-focus-segment ${focusMode === 'balanced' ? 'active' : ''}`}
                onClick={() => onFocusModeChange?.('balanced')}
                title="Balanced code & diagram (50% / 50%)"
              >
                Balanced
              </button>
              <button
                type="button"
                className={`tw-focus-segment ${focusMode === 'code' ? 'active' : ''}`}
                onClick={() => onFocusModeChange?.('code')}
                title="Code gets more space (65%)"
              >
                Code Focus
              </button>
            </div>
          </div>
        )}

        {/* Snapshot / Compare Pill if supplied */}
        {snapshotBar && <div className="tw-snapshot-slot">{snapshotBar}</div>}
      </div>

      {/* 3. Dataset Section (Accessible in both modes) */}
      {datasetSelector && <div>{datasetSelector}</div>}

      {/* 4. Primary Workspace Area */}
      {teachingMode === 'code-visual' ? (
        <div className={`tw-split-workspace focus-${focusMode}`}>
          <div className="tw-code-pane">{codePanel}</div>
          <div className="tw-diagram-pane">
            <div className="tw-vis-card">{visualization}</div>
          </div>
        </div>
      ) : (
        /* Visual Mode: Diagram is dominant full-width */
        <div className="tw-vis-card">{visualization}</div>
      )}

      {/* 5. Controls & Playback Row */}
      <div className="tw-controls-playback-bar">
        {parameterControls && <div className="tw-param-row">{parameterControls}</div>}
        {playbackControls && <div>{playbackControls}</div>}
      </div>

      {/* 6. Step Status & Explanation */}
      {statusExplanation && <div>{statusExplanation}</div>}
    </div>
  )
}

export default TeacherWorkspaceLayout
