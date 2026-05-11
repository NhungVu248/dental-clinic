import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

const pageTitles: Record<string, { title: string; subtitle?: string }> = {
  '/dashboard': { title: 'Tổng quan hệ thống', subtitle: 'Thống kê nhanh và truy cập các chức năng quản lý hệ thống DentCare Pro.' },
  '/users':     { title: 'Quản lý người dùng' },
  '/services':  { title: 'Dịch vụ nha khoa' },
  '/pricing':   { title: 'Bảng giá dịch vụ' },
  '/logs':      { title: 'Nhật ký hệ thống' },
  '/settings':  { title: 'Cài đặt hệ thống' },
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