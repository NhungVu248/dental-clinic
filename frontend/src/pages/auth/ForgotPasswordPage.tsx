import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { authApi } from '../../api/auth.api'
import { Mail, Loader2, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit } = useForm<{ email: string }>()

  const onSubmit = async (data: any) => {
    setLoading(true)
    setError('')
    try {
      await authApi.forgotPassword(data)
      setSent(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi hệ thống')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <a href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </a>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-xl mb-3">
            <Mail className="text-blue-600" size={22} />
          </div>
          <h2 className="text-xl font-bold">Quên mật khẩu</h2>
          <p className="text-gray-500 text-sm mt-1">Nhập email để nhận hướng dẫn đặt lại mật khẩu</p>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <div className="bg-green-50 text-green-700 px-4 py-4 rounded-xl text-sm">
              📧 Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.
            </div>
            <p className="text-gray-400 text-xs mt-4">Đường dẫn có hiệu lực trong 30 phút</p>
          </div>
        ) : (
          <>
            {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  {...register('email')}
                  type="email"
                  placeholder="example@nhakhoa.com"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium py-2.5 rounded-lg text-sm flex items-center justify-center gap-2">
                {loading && <Loader2 size={16} className="animate-spin" />}
                Gửi yêu cầu
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}