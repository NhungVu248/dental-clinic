import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard':           { title: 'Tổng quan hệ thống', subtitle: 'Thống kê nhanh và truy cập các chức năng quản lý hệ thống DentCare Pro.' },
  '/users':               { title: 'Quản lý người dùng', subtitle: 'Tạo, xem, cập nhật và quản lý vòng đời tài khoản nhân sự (UC05/UC06).' },
  '/users/receptionist':  { title: 'Quản lý Lễ tân',     subtitle: 'Quản lý tài khoản và thông tin bộ phận Lễ tân (UC05/UC06).' },
  '/users/doctor':        { title: 'Quản lý Bác sĩ',     subtitle: 'Quản lý tài khoản và thông tin bộ phận Bác sĩ (UC05/UC06).' },
  '/users/accountant':    { title: 'Quản lý Kế toán',    subtitle: 'Quản lý tài khoản và thông tin bộ phận Kế toán (UC05/UC06).' },
  '/users/admin':         { title: 'Quản lý Admin',       subtitle: 'Quản lý tài khoản và thông tin bộ phận Admin (UC05/UC06).' },
  '/services':            { title: 'Dịch vụ nha khoa' },
  '/pricing':             { title: 'Bảng giá dịch vụ' },
  '/services':            { title: 'Quản lý Dịch vụ Nha khoa', subtitle: 'Quản lý nhóm dịch vụ (UC08) và các dịch vụ (UC09) của phòng khám.' },
  '/services/groups':     { title: 'Quản lý Dịch vụ Nha khoa', subtitle: 'Quản lý nhóm dịch vụ (UC08) và các dịch vụ (UC09) của phòng khám.' },
  '/logs':                { title: 'Nhật ký hoạt động hệ thống', subtitle: 'Giám sát và truy vết các hành động quan trọng (UC07). Chỉ Admin được xem.' },
  '/settings':            { title: 'Cài đặt hệ thống' },
}

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()
  const page = pageTitles[location.pathname] || { title: 'DentCare Pro' }

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Header title={page.title} subtitle={page.subtitle} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#f9fafb' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}