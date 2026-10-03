import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import LinearRegressionPage from './pages/LinearRegressionPage.jsx'
import LinearRegressionSandboxPage from './pages/LinearRegressionSandboxPage.jsx'
import KMeansPage from './pages/KMeansPage.jsx'
import GradientDescentPage from './pages/GradientDescentPage.jsx'
import TopicOverviewPage from './pages/TopicOverviewPage.jsx'
import QuizPage from './pages/QuizPage.jsx'
import SummaryPage from './pages/SummaryPage.jsx'
import NotFound from './pages/NotFound.jsx'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="topic/:topicId" element={<TopicOverviewPage />} />
        <Route path="topic/:topicId/quiz" element={<QuizPage />} />
        <Route path="topic/:topicId/summary" element={<SummaryPage />} />
        <Route path="linear-regression" element={<LinearRegressionPage />} />
        <Route path="linear-regression/sandbox" element={<LinearRegressionSandboxPage />} />
        <Route path="k-means"element={<KMeansPage />} />
        <Route path="gradient-descent" element={<GradientDescentPage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

export default App
