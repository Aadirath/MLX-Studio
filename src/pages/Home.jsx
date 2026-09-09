import { Link } from 'react-router-dom'

function Home() {
  return (
    <section>
      <h1>Welcome to MLX Studio</h1>
      <p>
        This is a client-side React app scaffolded with Vite, styled with plain CSS and custom
        properties, and routed with React Router.
      </p>
      <p>
        Head over to the <Link to="/about">About</Link> page to learn more.
      </p>
    </section>
  )
}

export default Home
