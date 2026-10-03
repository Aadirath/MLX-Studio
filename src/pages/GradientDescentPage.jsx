import GradientDescent from '../components/GradientDescent.jsx'
import '../styles/paper.css'

function GradientDescentPage() {
  return (
    <section className="paper">
      <h1>Gradient descent — finding the bottom of the bowl</h1>
      <p className="sub">
        Linear Regression&apos;s guided lesson jumps straight to the exact formula (OLS). This is the other way to solve
        the same problem: start anywhere, and repeatedly nudge downhill until you reach the lowest error. The surface
        below plots every possible slope and intercept against how wrong that line would be.
      </p>
      <GradientDescent />
      <p className="sub" style={{ margin: '16px 0 0', fontSize: '12px' }}>
        Same dataset as the Linear Regression lesson: area (100 sq ft) vs. price (₹ lakh), 10 listings. The star marks
        the exact answer OLS computes directly.
      </p>
    </section>
  )
}

export default GradientDescentPage
