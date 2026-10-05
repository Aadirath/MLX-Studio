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
  controls,
  visualization,
  explanationPanel,
  playbackControls,
}) {
  return (
    <div className="tw-workspace">
      {/* Top Header & Navigation */}
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
          <span className="tw-badge">Teacher Demo</span>
        </div>
        <p className="tw-desc">{subtitle}</p>
      </header>

      {/* Controls & Configuration Bar */}
      {controls && <div className="tw-controls-bar">{controls}</div>}

      {/* Main Split Body: Visualization + Teaching Panel */}
      <div className="tw-body-grid">
        <div className="tw-vis-card">{visualization}</div>
        <div className="tw-side-col">{explanationPanel}</div>
      </div>

      {/* Playback Controls Bar */}
      {playbackControls && <div className="tw-playback-bar">{playbackControls}</div>}
    </div>
  )
}

export default TeacherWorkspaceLayout
