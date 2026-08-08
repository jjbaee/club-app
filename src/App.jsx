import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Board from './pages/Board'
import CalendarPage from './pages/Calendar'
import Files from './pages/Files'
import Members from './pages/Members'
import Chat from './pages/Chat'

function Gate({ children }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream text-muted">
        불러오는 중...
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return children
}

function AppRoutes() {
  const { session, loading } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={loading ? null : session ? <Navigate to="/board" replace /> : <Login />} />
      <Route element={<Gate><Layout /></Gate>}>
        <Route path="/board" element={<Board />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/files" element={<Files />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/members" element={<Members />} />
      </Route>
      <Route path="*" element={<Navigate to="/board" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
