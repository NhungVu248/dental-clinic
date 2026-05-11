import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import SetupPage from '../pages/auth/SetupPage'
import LoginPage from '../pages/auth/LoginPage'
import ChangePasswordPage from '../pages/auth/ChangePasswordPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/setup" element={<SetupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}