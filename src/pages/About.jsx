import '../styles/paper.css'

function About() {
  return (
    <section className="paper">
      <h1>About MLX Studio</h1>
      <p className="sub">
        MLX Studio is an interactive learning tool for core machine learning algorithms: Linear
        Regression, K-Means and Gradient Descent. Each topic has step-by-step simulations, quizzes
        and an AI assistant to help when you get stuck.
      </p>

      <h3>The course and the client</h3>
      <p>
        MLX Studio was built for ET617 Educational Application Development at IIT Bombay. The
        client is Dr. Kapil Kadam of D Y Patil College of Engineering and Technology, Kolhapur.
      </p>

      <h3>The team</h3>
      <p>Aadirath Singh, Umang Gupta and Vaibhavi Kadam.</p>

      <h3>About the AI assistant</h3>
      <p>
        The AI assistant sends your question and a short description of the current screen to
        Google&apos;s Gemini API. Please do not enter personal information.
      </p>

      <h3>Source code</h3>
      <p>
        <a href="https://github.com/EAD-Labs/Group-14_2026" target="_blank" rel="noopener noreferrer">
          github.com/EAD-Labs/Group-14_2026
        </a>
      </p>
    </section>
  )
}

export default About
