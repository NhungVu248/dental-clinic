import { Users, Stethoscope, Tag, ScrollText, KeyRound, UserCog, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const stats = [
  { label: 'Tổng tài khoản',         value: '6', desc: '1 Admin, 2 Lễ tân, 2 Bác sĩ, 1 Kế toán', icon: Users,       color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Dịch vụ đang hoạt động', value: '8', desc: '4 nhóm dịch vụ',                          icon: Stethoscope, color: '#22c55e', bg: '#f0fdf4' },
  { label: 'Bảng giá hiệu lực',      value: '7', desc: '2 sắp hết hạn',                           icon: Tag,         color: '#f59e0b', bg: '#fffbeb' },
  { label: 'Nhật ký hôm nay',        value: '9', desc: '8 thành công, 1 thất bại',                icon: ScrollText,  color: '#a855f7', bg: '#faf5ff' },
]

const quickAccess = [
  { label: 'Quản lý người dùng', desc: 'Tạo, xem, cập nhật và khóa/mở tài khoản nhân sự.',         icon: Users,       path: '/users',           tag: 'UC05/06' },
  { label: 'Dịch vụ nha khoa',   desc: 'Quản lý nhóm dịch vụ và các dịch vụ của phòng khám.',      icon: Stethoscope, path: '/services',         tag: 'UC08/09' },
  { label: 'Bảng giá dịch vụ',   desc: 'Thiết lập, cập nhật bảng giá với lịch sử thay đổi.',       icon: Tag,         path: '/pricing',          tag: 'UC10' },
  { label: 'Nhật ký hệ thống',   desc: 'Giám sát, lọc và xuất nhật ký hoạt động hệ thống.',        icon: ScrollText,  path: '/logs',             tag: 'UC07' },
  { label: 'Hồ sơ cá nhân',      desc: 'Xem và chỉnh sửa thông tin tài khoản Admin.',              icon: UserCog,     path: '/profile',          tag: '' },
  { label: 'Đổi mật khẩu',       desc: 'Cập nhật mật khẩu bảo mật tài khoản hiện tại.',           icon: KeyRound,    path: '/change-password',  tag: 'UC03' },
]

const activities = [
  { color: '#3b82f6', label: 'Tạo tài khoản "Hoàng Văn Em"',  sub: 'admin@nhakhoa.com · 18 phút trước' },
  { color: '#22c55e', label: 'Đổi mật khẩu thành công',        sub: 'levanc@nhakhoa.com · 45 phút trước' },
  { color: '#ef4444', label: 'Đăng nhập sai mật khẩu (3/5)',   sub: 'letan01 · 1 giờ trước' },
  { color: '#f59e0b', label: 'Khóa tài khoản "levanc"',        sub: 'admin@nhakhoa.com · 2 giờ trước' },
]

const alerts = [
  { bg: '#fffbeb', border: '#fcd34d', dot: '#f59e0b', text: '2 bảng giá sắp hết hạn trong 7 ngày' },
  { bg: '#fef2f2', border: '#fca5a5', dot: '#ef4444', text: '1 tài khoản đăng nhập sai 3/5 lần (letan01)' },
  { bg: '#eff6ff', border: '#93c5fd', dot: '#3b82f6', text: 'Dịch vụ "Niềng răng trong suốt" đang tạm dừng' },
  { bg: '#f0fdf4', border: '#86efac', dot: '#22c55e', text: 'Hệ thống hoạt động bình thường' },
]

export default function DashboardPage() {
  const navigate = useNavigate()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {stats.map(s => (
          <div key={s.label} style={{
            backgroundColor: 'white', borderRadius: '12px',
            border: '1px solid #f1f5f9', padding: '20px',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'
          }}>
            <div>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>{s.label}</p>
              <p style={{ fontSize: '32px', fontWeight: 700, color: '#111827', lineHeight: 1, marginBottom: '6px' }}>{s.value}</p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>{s.desc}</p>
            </div>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px',
              backgroundColor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <s.icon size={20} color={s.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Access */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {quickAccess.map(q => (
          <button key={q.label} onClick={() => navigate(q.path)} style={{
            backgroundColor: 'white', borderRadius: '12px',
            border: '1px solid #f1f5f9', padding: '18px 20px',
            display: 'flex', alignItems: 'center', gap: '16px',
            cursor: 'pointer', textAlign: 'left',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = '#bfdbfe'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(59,130,246,0.08)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = '#f1f5f9'
            ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', flexShrink: 0
            }}>
              <q.icon size={18} color="#3b82f6" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>{q.label}</span>
                {q.tag && (
                  <span style={{ fontSize: '11px', color: '#9ca3af', backgroundColor: '#f3f4f6', padding: '1px 8px', borderRadius: '20px' }}>
                    {q.tag}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', lineHeight: 1.5 }}>{q.desc}</p>
            </div>
            <ArrowRight size={14} color="#d1d5db" style={{ flexShrink: 0 }} />
          </button>
        ))}
      </div>

      {/* Activity + Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

        {/* Activity */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '20px' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>Hoạt động gần đây</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {activities.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{
                  width: '10px', height: '10px', borderRadius: '50%',
                  backgroundColor: a.color, marginTop: '4px', flexShrink: 0
                }} />
                <div>
                  <p style={{ fontSize: '13px', color: '#374151', fontWeight: 500 }}>{a.label}</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>{a.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f1f5f9', padding: '20px' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#111827', marginBottom: '16px' }}>Cảnh báo & Thông báo</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.map((a, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', borderRadius: '8px',
                backgroundColor: a.bg, border: `1px solid ${a.border}`
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: a.dot, flexShrink: 0 }} />
                <p style={{ fontSize: '13px', color: '#374151' }}>{a.text}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}