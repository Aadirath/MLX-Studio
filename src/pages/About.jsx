import ModeCompare from '../components/ModeCompare.jsx'
import '../styles/paper.css'
import './About.css'

// What other tools document, taken from their own pages (checked October 2026). The right-hand column only
// describes MLX Studio: it makes no claim about what the other tool lacks.
const COMPARED = [
  {
    tool: 'TensorFlow Playground',
    href: 'https://arxiv.org/abs/1708.03788',
    offers: 'A neural network that runs in the browser. You learn by direct manipulation of its settings, not by writing code.',
    adds: 'Linear regression, gradient descent and K-means, with a coach that works from your own experiments.',
  },
  {
    tool: 'Orange (Educational add-on)',
    href: 'https://opensource.googleblog.com/2017/01/google-summer-of-code-2016-wrap-up_25.html',
    offers: 'Interactive, step-by-step widgets for K-means and gradient descent, for beginners and for teachers explaining in class.',
    adds: 'Runs in a browser with nothing to install, with a pretest and posttest tied to the simulation and a coach in English, Hindi and Marathi.',
  },
  {
    tool: 'Google Colab with Gemini',
    href: 'https://developers.googleblog.com/fully-reimagined-ai-first-google-colab/',
    offers: 'Notebooks where Gemini can generate and transform code, fix errors, and run a data science agent that plans and executes analysis.',
    adds: 'A coach built to ask first: it asks you to predict before it explains, and points at your own results instead of writing the code for you.',
  },
  {
    tool: 'Virtual Labs: Machine Learning (IIT Roorkee)',
    href: 'https://ml-iitr.vlabs.ac.in/exp/kmeans-clustering/',
    offers: 'Experiments with an aim, theory, pretest, procedure, simulation, posttest and references, including K-means and how to choose K.',
    adds: 'We follow the same lesson order. On top of it: pretest questions mapped to things to try in the simulation, and a coach that reads your experiments.',
  },
  {
    tool: 'Google Machine Learning Crash Course',
    href: 'https://developers.google.com/machine-learning/crash-course/exercises',
    offers: 'Interactive exercises on linear regression parameters and gradient descent, quizzes, and programming exercises that run in Colab.',
    adds: 'K-means too, your own CSV, hearing the error, and a teacher mode with code you can break on purpose.',
  },
]

function About() {
  return (
    <section className="paper aboutPage">
      <h1>About MLX Studio</h1>
      <p className="sub">
        MLX Studio is an interactive learning tool for core machine learning algorithms: Linear Regression, K-Means and
        Gradient Descent. Each topic has a short lesson, a simulation you can experiment with, a pretest and posttest, and an
        AI coach to help when you get stuck.
      </p>

      <h2>What is different about it</h2>
      <p>
        Step-by-step pictures of these algorithms already exist, and we do not claim them as new. What MLX Studio adds is
        the way the pieces work together for one learner or one classroom:
      </p>
      <ul className="aboutList">
        <li>
          <b>A coach that asks first.</b> It reads your own experiments, asks you to predict before it explains, and suggests
          one next experiment. It answers in English, Hindi or Marathi.
        </li>
        <li>
          <b>Hear the error.</b> A tone follows the error as you step, so a falling or jumping error can be heard as well as
          seen.
        </li>
        <li>
          <b>A pretest that points into the simulation.</b> Each question is tied to an idea and to something to try. The
          posttest then shows each idea before and after.
        </li>
        <li>
          <b>Code you can break on purpose.</b> In teacher mode a runnable version of each algorithm shows real errors, line
          numbers and what a bug does to the result.
        </li>
        <li>
          <b>Made for breaking things.</b> Learning-rate zones, a dataset where K-means fails, your own CSV and the
          assumptions behind each method.
        </li>
        <li>
          <b>One tool for the classroom and for self-study,</b> with anonymous usage logs that give teachers class insights.
        </li>
      </ul>

      <h2>How it compares</h2>
      <p className="aboutNote">
        The middle column is what each tool documents about itself. The last column describes only MLX Studio. Checked in
        October 2026.
      </p>
      <div className="aboutTableWrap">
        <table className="aboutTable">
          <thead>
            <tr>
              <th scope="col">Tool</th>
              <th scope="col">What it documents</th>
              <th scope="col">What MLX Studio adds</th>
            </tr>
          </thead>
          <tbody>
            {COMPARED.map((c) => (
              <tr key={c.tool}>
                <th scope="row">
                  <a href={c.href} target="_blank" rel="noopener noreferrer">
                    {c.tool}
                  </a>
                </th>
                <td>{c.offers}</td>
                <td>{c.adds}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Student mode and teacher mode</h2>
      <ModeCompare />

      <h2>The course and the client</h2>
      <p>
        MLX Studio was built for ET617 Educational Application Development at IIT Bombay. The client is Dr. Kapil Kadam of D
        Y Patil College of Engineering and Technology, Kolhapur.
      </p>

      <h2>The team</h2>
      <p>Aadirath Singh, Umang Gupta and Vaibhavi Kadam.</p>

      <h2>Privacy and data</h2>
      <p>
        To improve the lessons, MLX Studio records anonymous events: which page you open, the experiments and predictions you
        make, your pretest and posttest scores, and the questions you ask the coach. Each browser tab gets a random ID. Our
        database stores no names, emails or IP addresses. Browsers that send &quot;Do Not Track&quot; are not logged. Please
        do not type personal information into the coach.
      </p>

      <h2>About the AI coach</h2>
      <p>
        The coach sends your question, a short description of the current screen, your recent experiment results and your
        chosen language to Google&apos;s Gemini API. The Listen button uses the speech voices built into your browser.
      </p>

      <h2>Source code</h2>
      <p>
        <a href="https://github.com/EAD-Labs/Group-14_2026" target="_blank" rel="noopener noreferrer">
          github.com/EAD-Labs/Group-14_2026
        </a>
      </p>
    </section>
  )
}

export default About
