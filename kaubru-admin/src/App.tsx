import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import UsersPage from './pages/UsersPage'
import UserDetailPage from './pages/UserDetailPage'
import WordsPage from './pages/WordsPage'
import ContributionsPage from './pages/ContributionsPage'
import LessonsPage from './pages/LessonsPage'
import TranslationsPage from './pages/TranslationsPage'
import StoriesPage from './pages/StoriesPage'
import ActivityPage from './pages/ActivityPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="words" element={<WordsPage />} />
          <Route path="contributions" element={<ContributionsPage />} />
          <Route path="lessons" element={<LessonsPage />} />
          <Route path="translations" element={<TranslationsPage />} />
          <Route path="stories" element={<StoriesPage />} />
          <Route path="activity" element={<ActivityPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
