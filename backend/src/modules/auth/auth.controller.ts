import { Request, Response } from 'express'
import * as authService from './auth.service'

const passwordPolicy = (pw: string) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(pw)

const parseIdParam = (id: string | string[]) =>
  parseInt(Array.isArray(id) ? id[0] : id, 10)

// UC01
export const checkSetup = async (_: Request, res: Response) => {
  const exists = await authService.checkAdminExists()
  res.json({ initialized: exists })
}

export const setupAdmin = async (req: Request, res: Response) => {
  try {
    const exists = await authService.checkAdminExists()
    if (exists) return res.status(403).json({ message: 'Hệ thống đã được khởi tạo' })

    const { fullName, username, email, password, confirmPassword } = req.body

    if (password !== confirmPassword)
      return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' })

    if (!passwordPolicy(password))
      return res.status(400).json({ message: 'Mật khẩu không đạt chính sách bảo mật' })

    await authService.setupAdmin({ fullName, username, email, password }, req.ip || '')
    res.status(201).json({ message: 'Tạo tài khoản Admin thành công' })
  } catch (err: any) {
    if (err.code === 'P2002')
      return res.status(400).json({ message: 'Tên đăng nhập hoặc email đã tồn tại' })
    res.status(500).json({ message: 'Lỗi hệ thống' })
  }
}

// Đăng ký Admin tự do
export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { fullName, username, email, password, confirmPassword } = req.body

    if (password !== confirmPassword)
      return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' })

    if (!passwordPolicy(password))
      return res.status(400).json({ message: 'Mật khẩu không đạt chính sách bảo mật' })

    await authService.registerAdmin({ fullName, username, email, password }, req.ip || '')
    res.status(201).json({ message: 'Đăng ký tài khoản Admin thành công' })
  } catch (err: any) {
    if (err.code === 'P2002')
      return res.status(400).json({ message: 'Tên đăng nhập hoặc email đã tồn tại' })
    res.status(500).json({ message: 'Lỗi hệ thống' })
  }
}

// UC02
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body
    const result = await authService.login(username, password, req.ip || '')
    res.json(result)
  } catch (err: any) {
    const messages: Record<string, [number, string]> = {
      INVALID_CREDENTIALS: [401, 'Tên đăng nhập hoặc mật khẩu không đúng'],
      ACCOUNT_LOCKED:      [403, 'Tài khoản bị khóa tạm thời 15 phút'],
      ACCOUNT_DISABLED:    [403, 'Tài khoản bị vô hiệu hóa, liên hệ Admin'],
    }
    const [status, message] = messages[err.message] || [500, 'Lỗi hệ thống']
    res.status(status).json({ message })
  }
}

// UC03
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body
    const userId = (req as any).user.userId

    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' })

    if (!passwordPolicy(newPassword))
      return res.status(400).json({ message: 'Mật khẩu không đạt chính sách bảo mật' })

    await authService.changePassword(userId, currentPassword, newPassword, req.ip || '')
    res.json({ message: 'Đổi mật khẩu thành công, vui lòng đăng nhập lại' })
  } catch (err: any) {
    const messages: Record<string, [number, string]> = {
      WRONG_PASSWORD: [400, 'Mật khẩu hiện tại không đúng'],
      SAME_PASSWORD:  [400, 'Mật khẩu mới phải khác mật khẩu cũ'],
    }
    const [status, message] = messages[err.message] || [500, 'Lỗi hệ thống']
    res.status(status).json({ message })
  }
}

// UC04
export const requestReset = async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    const result = await authService.requestPasswordReset(email, req.ip || '')
    if (result) {
      console.log(`Reset token: ${result.token}`)
    }
    res.json({ message: 'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.' })
  } catch (err: any) {
    if (err.message === 'RATE_LIMIT')
      return res.status(429).json({ message: 'Quá nhiều yêu cầu, thử lại sau 15 phút' })
    res.status(500).json({ message: 'Lỗi hệ thống' })
  }
}

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword, confirmPassword } = req.body

    if (newPassword !== confirmPassword)
      return res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' })

    if (!passwordPolicy(newPassword))
      return res.status(400).json({ message: 'Mật khẩu không đạt chính sách bảo mật' })

    await authService.resetPassword(token, newPassword)
    res.json({ message: 'Đặt lại mật khẩu thành công' })
  } catch (err: any) {
    const messages: Record<string, [number, string]> = {
      INVALID_TOKEN: [400, 'Đường dẫn không hợp lệ'],
      TOKEN_USED:    [400, 'Đường dẫn đã được sử dụng'],
      TOKEN_EXPIRED: [400, 'Đường dẫn đã hết hạn, vui lòng yêu cầu lại'],
    }
    const [status, message] = messages[err.message] || [500, 'Lỗi hệ thống']
    res.status(status).json({ message })
  }
}

// Danh sách tài khoản
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await authService.getUsers()
    res.json(users)
  } catch {
    res.status(500).json({ message: 'Lỗi hệ thống' })
  }
}

// Khóa / Mở tài khoản
export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const targetId = parseIdParam(req.params.id)
    const { isActive } = req.body
    const operatorId = (req as any).user.userId
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || ''

    await authService.toggleUserStatus(targetId, isActive, operatorId, ip)
    res.json({ message: isActive ? 'Đã mở tài khoản' : 'Đã khóa tài khoản' })
  } catch (err: any) {
    const messages: Record<string, [number, string]> = {
      USER_NOT_FOUND:   [404, 'Không tìm thấy tài khoản'],
      CANNOT_SELF_LOCK: [400, 'Không thể khóa tài khoản của chính mình'],
    }
    const [status, message] = messages[err.message] || [500, 'Lỗi hệ thống']
    res.status(status).json({ message })
  }
}

// Xóa tài khoản
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const targetId = parseIdParam(req.params.id)
    const operatorId = (req as any).user.userId
    const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || ''

    await authService.deleteUser(targetId, operatorId, ip)
    res.json({ message: 'Đã xóa tài khoản' })
  } catch (err: any) {
    const messages: Record<string, [number, string]> = {
      USER_NOT_FOUND:     [404, 'Không tìm thấy tài khoản'],
      CANNOT_SELF_DELETE: [400, 'Không thể xóa tài khoản của chính mình'],
      HAS_ACTIVITY_LOG:   [400, 'Không thể xóa tài khoản đã có lịch sử hoạt động'],
    }
    const [status, message] = messages[err.message] || [500, 'Lỗi hệ thống']
    res.status(status).json({ message })
  }
}