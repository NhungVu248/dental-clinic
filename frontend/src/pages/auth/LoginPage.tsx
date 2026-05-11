import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../stores/auth.store'
import { HeartPulse, Eye, EyeOff, Loader2, ShieldCheck, UserRound, Calculator, Stethoscope } from 'lucide-react'
import clsx from 'clsx'

const ROLES = [
  { key: 'ADMIN',        label: 'Quản trị viên', icon: ShieldCheck,  color: 'bg-purple-50 border-purple-200 text-purple-600' },
  { key: 'RECEPTIONIST', label: 'Lễ tân',         icon: UserRound,    color: 'bg-blue-600 border-blue-600 text-white' },
  { key: 'ACCOUNTANT',   label: 'Kế toán',        icon: Calculator,   color: 'bg-green-50 border-green-200 text-green-600' },
  { key: 'DOCTOR',       label: 'Bác sĩ',         icon: Stethoscope,  color: 'bg-teal-50 border-teal-200 text-teal-600' },
]

// Màn hình chọn role khi user có nhiều role
function RoleSelector({ roles, onSelect }: { roles: string[], onSelect: (r: string) => void }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 w-full max-w-sm">
        <h2 className="text-xl font-bold text-center mb-2">Chọn vai trò</h2>
        <p className="text-gray-500 text-sm text-center mb-6">Bạn muốn đăng nhập với vai trò nào?</p>
        <div className="space-y-3">
          {ROLES.filter(r => roles.includes(r.key)).map(r => (
            <button key={r.key} onClick={() => onSelect(r.key)}
              className="w-full flex items-center gap-3 p-4 border-2 border-gray-100 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all">
              <r.icon size={20} className="text-blue-600" />
              <span className="font-medium">{r.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, setActiveRole } = useAuthStore()
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingLogin, setPendingLogin] = useState<{ token: string; user: any } | null>(null)

  const { register, handleSubmit } = useForm<{ username: string; password: string }>()

  const onSubmit = async (data: any) => {
    setLoading(true)
    setError('')
    try {
      const res = await authApi.login(data)
      const { token, user } = res.data

      if (user.roles.includes('ADMIN')) {
        setAuth(token, user)
        setActiveRole('ADMIN')
        navigate('/dashboard') // sẽ tạo sau
      } else if (user.roles.length === 1) {
        setAuth(token, user)
        setActiveRole(user.roles[0])
        navigate('/dashboard')
      } else {
        // Nhiều role → hiện màn chọn
        setPendingLogin({ token, user })
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi hệ thống')
    } finally {
      setLoading(false)
    }
  }

  const handleRoleSelect = (role: string) => {
    if (!pendingLogin) return
    setAuth(pendingLogin.token, pendingLogin.user)
    setActiveRole(role)
    navigate('/dashboard')
  }

  if (pendingLogin) return <RoleSelector roles={pendingLogin.user.roles} onSelect={handleRoleSelect} />

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <HeartPulse size={20} />
          </div>
          <div>
            <p className="font-bold">DentCare Pro</p>
            <p className="text-blue-200 text-xs">Hệ thống quản lý phòng khám nha khoa</p>
          </div>
        </div>

        <div>
          <h2 className="text-4xl font-bold mb-4">Chào mừng trở lại!</h2>
          <p className="text-blue-200 leading-relaxed">
            Hệ thống quản lý phòng khám nha khoa toàn diện — đặt lịch, quản lý ca làm việc,
            theo dõi bệnh nhân và báo cáo thống kê.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-8">
            {[
              { label: 'Lịch hẹn hôm nay', value: '24' },
              { label: 'Bác sĩ trực ca', value: '6' },
              { label: 'Bệnh nhân mới', value: '8' },
              { label: 'Tỉ lệ đúng hẹn', value: '94%' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="text-blue-200 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-sm">© 2025 DentCare Pro. Phiên bản 4.0</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Đăng nhập hệ thống</h2>
            <p className="text-gray-500 text-sm mt-1">Chọn vai trò và nhập thông tin đăng nhập</p>
          </div>

          {/* Role buttons (visual only) */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {ROLES.map(r => (
              <div key={r.key}
                className={clsx('flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-default', r.color)}>
                <r.icon size={22} />
                <span className="text-sm font-medium">{r.label}</span>
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
              <input
                {...register('username')}
                placeholder="Nhập tên đăng nhập"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                Quên mật khẩu?
              </a>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
              {loading && <Loader2 size={16} className="animate-spin" />}
              Đăng nhập
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}