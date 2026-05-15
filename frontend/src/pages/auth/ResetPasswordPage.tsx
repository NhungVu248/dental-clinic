import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { authApi } from '../../api/auth.api'
import { Eye, EyeOff, Loader2, CheckCircle2, HeartPulse } from 'lucide-react'

const schema = z.object({
  newPassword: z.string()
    .min(8, 'Tối thiểu 8 ký tự')
    .regex(/[A-Z]/, 'Cần ít nhất 1 chữ HOA')
    .regex(/[a-z]/, 'Cần ít nhất 1 chữ thường')
    .regex(/[0-9]/, 'Cần ít nhất 1 chữ số')
    .regex(/[^A-Za-z0-9]/, 'Cần ít nhất 1 ký tự đặc biệt'),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

const policies = [
  { label: '≥ 8 ký tự',                 regex: /.{8,}/ },
  { label: 'Ít nhất 1 chữ HOA (A–Z)',    regex: /[A-Z]/ },
  { label: 'Ít nhất 1 chữ thường (a–z)', regex: /[a-z]/ },
  { label: 'Ít nhất 1 chữ số (0–9)',     regex: /[0-9]/ },
  { label: 'Ít nhất 1 ký tự đặc biệt',  regex: /[^A-Za-z0-9]/ },
]

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [showNew, setShowNew] = useState(false)
  const [showCon, setShowCon] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(3)

  useEffect(() => {
    if (!token) navigate('/forgot-password', { replace: true })
  }, [token, navigate])

  useEffect(() => {
    if (!success) return
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(id); navigate('/login'); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [success, navigate])

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const watchedNew = watch('newPassword', '')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    try {
      await authApi.resetPassword({ token, newPassword: data.newPassword, confirmPassword: data.confirmPassword })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi hệ thống')
    } finally {
      setLoading(false)
    }
  }

  if (!token) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">

      {/* Brand */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-3">
          <HeartPulse className="text-white" size={28} />
        </div>
        <h1 className="text-xl font-bold text-gray-900">DentCare Pro</h1>
        <p className="text-sm text-gray-500">Hệ thống Quản lý Phòng khám</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

        {success ? (
          <div className="text-center py-4 space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-full">
              <CheckCircle2 className="text-green-600" size={32} />
            </div>
            <p className="font-semibold text-gray-800">Đặt lại mật khẩu thành công!</p>
            <p className="text-sm text-gray-500">
              Đang chuyển về trang đăng nhập sau <span className="font-medium text-blue-600">{countdown}s</span>...
            </p>
            <Link to="/login" className="inline-block text-sm text-blue-600 hover:underline mt-2">
              Đăng nhập ngay
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Đặt lại mật khẩu</h2>
              <p className="text-sm text-gray-500 mt-1">
                Tạo mật khẩu mới cho tài khoản của bạn
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    {...register('newPassword')}
                    type={showNew ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.newPassword ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Policy checklist */}
                <div className="mt-2 space-y-1">
                  {policies.map(p => {
                    const ok = p.regex.test(watchedNew)
                    return (
                      <div key={p.label} className="flex items-center gap-2">
                        <CheckCircle2
                          size={13}
                          className={ok ? 'text-green-500' : 'text-gray-300'}
                          fill={ok ? '#dcfce7' : 'none'}
                        />
                        <span className={`text-xs ${ok ? 'text-green-600' : 'text-gray-400'}`}>
                          {p.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    type={showCon ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`w-full border rounded-lg px-3 py-2.5 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCon(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showCon ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 mt-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Xác nhận đặt lại mật khẩu
              </button>
            </form>

            <div className="text-center mt-5">
              <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700">
                Quay lại đăng nhập
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
