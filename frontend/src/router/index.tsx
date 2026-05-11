import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import MainLayout from '../layouts/MainLayout'
import SetupPage from '../pages/auth/SetupPage'
import LoginPage from '../pages/auth/LoginPage'
import ChangePasswordPage from '../pages/auth/ChangePasswordPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import RegisterPage from '../pages/auth/RegisterPage'

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/setup"           element={<SetupPage />} />
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/register"        element={<RegisterPage />} />
        {/* Protected với Layout */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard"       element={<DashboardPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/"                element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}