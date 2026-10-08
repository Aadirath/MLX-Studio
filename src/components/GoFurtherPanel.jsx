import './GoFurtherPanel.css'

const COLAB = {
  label: 'Open playground',
  title: 'Start a blank notebook in Colab',
  desc: 'Free-form space to try the scikit-learn code yourself, no setup required.',
  href: 'https://colab.research.google.com',
}

const LINKS = {
  linreg: [
    {
      label: 'Real code',
      title: "scikit-learn's Linear Regression example",
      desc: 'The official worked example, with one-click Launch Binder and Launch JupyterLite buttons for a live notebook.',
      href: 'https://scikit-learn.org/1.6/auto_examples/linear_model/plot_ols.html',
    },
    {
      label: 'Another angle',
      title: 'Virtual Labs: Linear Regression',
      desc: "IIT Roorkee's lab version of this experiment, with its own theory, procedure, and assessment.",
      href: 'https://ml-iitr.vlabs.ac.in/exp/linear-regression/',
    },
    COLAB,
  ],
  kmeans: [
    {
      label: 'Real code',
      title: "scikit-learn's Clustering examples",
      desc: 'Official worked examples for K-Means and related methods, each with live Binder and JupyterLite notebooks.',
      href: 'https://scikit-learn.org/stable/auto_examples/cluster/index.html',
    },
    {
      label: 'Another angle',
      title: 'Virtual Labs: K-Means Clustering',
      desc: "IIT Roorkee's lab version of this experiment, with its own theory, procedure, and assessment.",
      href: 'https://ml-iitr.vlabs.ac.in/exp/kmeans-clustering/',
    },
    COLAB,
  ],
  gradientDescent: [
    {
      label: 'Real code',
      title: 'scikit-learn: Stochastic Gradient Descent',
      desc: 'The official guide to gradient descent in practice, including why it is sensitive to feature scaling',
      href: 'https://scikit-learn.org/stable/modules/sgd.html',
    },
    {
      label: 'Another angle',
      title: 'Google Machine Learning Crash Course',
      desc: 'Free course whose Linear Regression module covers loss, gradient descent and tuning, with interactive exercises',
      href: 'https://developers.google.com/machine-learning/crash-course',
    },
    {
      label: 'Open playground',
      title: 'Start a blank notebook in Colab',
      desc: 'Free-form space to try the code yourself, no setup required',
      href: 'https://colab.research.google.com',
    },
  ],
}

function GoFurtherPanel({ topic }) {
  const links = LINKS[topic]
  if (!links) return null

  return (
    <section className="goFurther" aria-labelledby="goFurtherTitle">
      <h2 id="goFurtherTitle">Want to go further?</h2>
      <div className="goFurther-cards">
        {links.map((l) => (
          <a key={l.title} className="goFurther-card" href={l.href} target="_blank" rel="noopener noreferrer">
            <div className="cardLabel">{l.label}</div>
            <div className="cardTitle">{l.title}</div>
            <div className="cardDesc">{l.desc}</div>
          </a>
        ))}
      </div>
    </section>
  )
}

export default GoFurtherPanel
