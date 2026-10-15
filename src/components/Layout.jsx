import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import './Layout.css'
import '../styles/shell.css'
import { BrandGlyph, MoonIcon, SunIcon } from './ShellIcons.jsx'

function getInitialTheme() {
  const stored = localStorage.getItem('theme')
  return stored === 'light' || stored === 'dark' ? stored : null
}

function Layout() {
  const [theme, setTheme] = useState(getInitialTheme)
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const isWide = location.pathname.startsWith('/topic/') || location.pathname.startsWith('/teacher/')
  const wide = isWide ? ' container--wide' : ''
  const resolvedTheme = theme ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

  const goBack = () => {
    if (location.key === 'default') {
      navigate('/')
    } else {
      navigate(-1)
    }
  }

  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('theme', theme)
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.removeItem('theme')
    }
  }, [theme])

  const toggleTheme = () => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const current = theme ?? (prefersDark ? 'dark' : 'light')
    setTheme(current === 'dark' ? 'light' : 'dark')
  }

  return (
    <div className="layout">
      <header className="mx-top">
        <div className="mx-top__inner">
          <Link to="/" className="mx-brand" aria-label="MLX Studio home">
            <BrandGlyph />
            MLX Studio
          </Link>
          <nav className="mx-nav" aria-label="Main">
            <NavLink to="/topic/linear-regression">Linear regression</NavLink>
            <NavLink to="/topic/gradient-descent">Gradient descent</NavLink>
            <NavLink to="/topic/k-means">K-means</NavLink>
            <NavLink to="/about">About</NavLink>
          </nav>
          <span className="mx-spacer" />
          <NavLink to="/teacher" className="mx-btn mx-btn--quiet">
            Teacher mode
          </NavLink>
          <button
            type="button"
            className="mx-btn mx-btn--quiet mx-btn--icon"
            onClick={toggleTheme}
            aria-label={resolvedTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {resolvedTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </header>

      {!isHome && (
        <div className={`container back-bar${wide}`}>
          <button type="button" className="back-button" onClick={goBack}>
            Back
          </button>
        </div>
      )}

      <main className={isHome ? 'site-main site-main--home' : `site-main container${wide}`}>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>MLX Studio is a learning tool built for ET617 at IIT Bombay, with D Y Patil College of Engineering and Technology, Kolhapur. <a href="/design-concept.html" target="_blank" rel="noopener">Design concept</a></p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
