import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import ActivityLogger from './components/ActivityLogger.jsx'
import Layout from './components/Layout.jsx'
import TeacherGate from './components/teacher/TeacherGate.jsx'
import Home from './pages/Home.jsx'
import About from './pages/About.jsx'
import LinearRegressionSandboxPage from './pages/LinearRegressionSandboxPage.jsx'
import LabPage from './pages/LabPage.jsx'
import SummaryPage from './pages/SummaryPage.jsx'
import NotFound from './pages/NotFound.jsx'

// Teacher pages load only after the passcode check, so student pages stay light.
const TeacherDashboardPage = lazy(() => import('./pages/teacher/TeacherDashboardPage.jsx'))
const TeacherLinearRegressionPage = lazy(() => import('./pages/teacher/TeacherLinearRegressionPage.jsx'))
const TeacherKMeansPage = lazy(() => import('./pages/teacher/TeacherKMeansPage.jsx'))
const TeacherGradientDescentPage = lazy(() => import('./pages/teacher/TeacherGradientDescentPage.jsx'))

// Old quiz links now go to the posttest.
function QuizRedirect() {
  const { topicId } = useParams()
  return <Navigate to={`/topic/${topicId}/posttest`} replace />
}

function App() {
  return (
    <>
      <ActivityLogger />
      <Suspense fallback={<p className="sub" style={{ padding: 24 }}>Loading…</p>}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="topic/:topicId" element={<LabPage />} />
            <Route path="topic/:topicId/quiz" element={<QuizRedirect />} />
            <Route path="topic/:topicId/summary" element={<SummaryPage />} />
            <Route path="topic/:topicId/:section" element={<LabPage />} />
            <Route path="linear-regression" element={<Navigate to="/topic/linear-regression/simulation" replace />} />
            <Route path="linear-regression/sandbox" element={<LinearRegressionSandboxPage />} />
            <Route path="k-means" element={<Navigate to="/topic/k-means/simulation" replace />} />
            <Route path="gradient-descent" element={<Navigate to="/topic/gradient-descent/simulation" replace />} />
            <Route element={<TeacherGate />}>
              <Route path="teacher" element={<TeacherDashboardPage />} />
              <Route path="teacher/linear-regression" element={<TeacherLinearRegressionPage />} />
              <Route path="teacher/k-means" element={<TeacherKMeansPage />} />
              <Route path="teacher/gradient-descent" element={<TeacherGradientDescentPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}

export default App
