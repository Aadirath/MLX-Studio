import { Link } from 'react-router-dom'
import '../../styles/paper.css'

const TEACHER_TOPICS = [
  {
    id: 'linear-regression',
    name: 'Linear Regression',
    ico: '📈',
    path: '/teacher/linear-regression',
    description:
      'Demonstrate how a regression model learns the relationship between input and output values and how the line of best fit changes based on the data.',
    features: ['Residual error visualization', 'Step-by-step weight updates', 'Outlier sensitivity demo'],
  },
  {
    id: 'k-means',
    name: 'K-Means Clustering',
    ico: '✳︎',
    path: '/teacher/k-means',
    description:
      'Demonstrate how K-Means groups data points by repeatedly assigning points to clusters and updating cluster centroids.',
    features: ['Distance calculation & Voronoi hints', 'Centroid movement trails', 'Deliberate poor-start comparison'],
  },
  {
    id: 'gradient-descent',
    name: 'Gradient Descent',
    ico: '⛰️',
    path: '/teacher/gradient-descent',
    description:
      'Demonstrate how an optimisation algorithm iteratively updates model parameters to minimise a loss function.',
    features: ['2D Error surface landscape', 'Gradient vector direction', 'Learning rate overshooting demo'],
  },
]

function TeacherDashboardPage() {
  return (
    <section className="paper">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
        <h1>Teacher Mode</h1>
        <span className="pill" style={{ background: 'var(--blue-soft)', borderColor: 'var(--blue)', color: 'var(--blue)', fontWeight: 600 }}>
          Classroom Demonstrations
        </span>
      </div>
      <p className="sub">
        Dedicated interactive environments designed for lecture demonstrations. Control parameters, execute algorithms
        step-by-step, and visually explain internal mechanics in real time.
      </p>

      <div className="cards">
        {TEACHER_TOPICS.map((topic) => (
          <div className="card" key={topic.id}>
            <div className="ico">{topic.ico}</div>
            <h3>{topic.name}</h3>
            <p>{topic.description}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px', fontSize: '11.5px', color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {topic.features.map((feat, idx) => (
                <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: 'var(--blue)', fontWeight: 'bold' }}>✓</span> {feat}
                </li>
              ))}
            </ul>
            <Link className="cardBtn" to={topic.path}>
              Open Workspace
            </Link>
          </div>
        ))}
      </div>
    </section>
  )
}

export default TeacherDashboardPage
