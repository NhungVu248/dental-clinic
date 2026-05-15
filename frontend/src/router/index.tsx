import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../stores/auth.store'
import MainLayout from '../layouts/MainLayout'
import SetupPage from '../pages/auth/SetupPage'
import LoginPage from '../pages/auth/LoginPage'
import ChangePasswordPage from '../pages/auth/ChangePasswordPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import ResetPasswordPage from '../pages/auth/ResetPasswordPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import UsersPage from '../pages/users/UsersPage'
import StaffPortalPage from '../pages/staff/StaffPortalPage'
import LogsPage from '../pages/logs/LogsPage'

// Đã đăng nhập mới vào được
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore(s => s.token)
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

// Chỉ Admin mới vào được khu quản trị
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, activeRole } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (activeRole !== 'ADMIN') return <Navigate to="/staff-portal" replace />
  return <>{children}</>
}

// Nhân sự (non-admin) đã đăng nhập
const StaffRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, activeRole } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (activeRole === 'ADMIN') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/setup"           element={<SetupPage />} />
        <Route path="/login"           element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password"  element={<ResetPasswordPage />} />

        {/* Giao diện nhân sự (Lễ tân / Bác sĩ / Kế toán) */}
        <Route path="/staff-portal" element={
          <StaffRoute><StaffPortalPage /></StaffRoute>
        } />

        {/* Giao diện Admin — MainLayout */}
        <Route element={
          <AdminRoute>
            <MainLayout />
          </AdminRoute>
        }>
          <Route path="/dashboard"       element={<DashboardPage />} />
          <Route path="/users"           element={<UsersPage />} />
          <Route path="/users/:role"     element={<UsersPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/logs"            element={<LogsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="/" element={
          <ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}