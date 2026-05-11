import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../stores/auth.store'
import { Eye, EyeOff, Loader2, KeyRound } from 'lucide-react'

const schema = z.object({
  currentPassword: z.string().min(1, 'Nhập mật khẩu hiện tại'),
  newPassword: z.string()
    .min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/).regex(/[^A-Za-z0-9]/),
  confirmPassword: z.string(),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ChangePasswordPage() {
  const navigate = useNavigate()
  const logout = useAuthStore(s => s.logout)
  const [show, setShow] = useState({ cur: false, new: false, con: false })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError('')
    try {
      await authApi.changePassword(data)
      setSuccess(true)
      setTimeout(() => { logout(); navigate('/login') }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi hệ thống')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-3">
            <KeyRound className="text-blue-600" size={22} />
          </div>
          <h2 className="text-xl font-bold">Đổi mật khẩu</h2>
          <p className="text-gray-500 text-sm mt-1">Sau khi đổi bạn sẽ cần đăng nhập lại</p>
        </div>

        {success && (
          <div className="bg-green-50 text-green-600 text-sm px-4 py-3 rounded-lg mb-4 text-center">
            ✅ Đổi mật khẩu thành công! Đang chuyển về trang đăng nhập...
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { name: 'currentPassword', label: 'Mật khẩu hiện tại', key: 'cur' as const },
            { name: 'newPassword',     label: 'Mật khẩu mới',      key: 'new' as const },
            { name: 'confirmPassword', label: 'Xác nhận mật khẩu mới', key: 'con' as const },
          ].map(f => (
            <div key={f.name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <div className="relative">
                <input
                  {...register(f.name as any)}
                  type={show[f.key] ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button type="button" onClick={() => setShow(s => ({ ...s, [f.key]: !s[f.key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {show[f.key] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors[f.name as keyof FormData] && (
                <p className="text-red-500 text-xs mt-1">{errors[f.name as keyof FormData]?.message}</p>
              )}
            </div>
          ))}

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
            <p className="font-medium text-gray-600">Chính sách mật khẩu:</p>
            <p>• Tối thiểu 8 ký tự</p>
            <p>• Ít nhất 1 chữ hoa, 1 chữ thường</p>
            <p>• Ít nhất 1 chữ số và 1 ký tự đặc biệt</p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Lưu mật khẩu mới
          </button>
        </form>
      </div>
    </div>
  )
}