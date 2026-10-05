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
}) {
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
          <h1 className="tw-title">{title}</h1>
          <span className="tw-badge">Interactive Playground</span>
        </div>
        <p className="tw-desc">{subtitle}</p>
      </header>

      {/* 2. Dataset Section (Preset dropdown + Upload CSV + Mapping) */}
      {datasetSelector && <div>{datasetSelector}</div>}

      {/* 3. Main Visualisation (Full width & dominant) */}
      <div className="tw-vis-card">{visualization}</div>

      {/* 4. Controls & Playback Row */}
      <div className="tw-controls-playback-bar">
        {parameterControls && <div className="tw-param-row">{parameterControls}</div>}
        {playbackControls && <div>{playbackControls}</div>}
      </div>

      {/* 5. Progressive Disclosure Step Status & Explanation */}
      {statusExplanation && <div>{statusExplanation}</div>}
    </div>
  )
}

export default TeacherWorkspaceLayout
