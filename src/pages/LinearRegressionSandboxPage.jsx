import { Link } from 'react-router-dom'
import LinearRegressionSandbox from '../components/LinearRegressionSandbox.jsx'
import '../styles/paper.css'

function LinearRegressionSandboxPage() {
  return (
    <section className="paper">
      <h1>Linear regression — sandbox</h1>
      <p className="sub">
        Bring your own data: enter points manually or upload a CSV with two numeric columns. This fits a line using the
        same ordinary least squares formula as the guided lesson, just on whatever data you give it.
      </p>
      <LinearRegressionSandbox />
      <div className="quizCta">
        <Link className="ghostBtn" to="/linear-regression">
          Back to the guided lesson
        </Link>
      </div>
    </section>
  )
}

export default LinearRegressionSandboxPage
