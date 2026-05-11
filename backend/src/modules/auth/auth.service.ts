import { PrismaClient } from '@prisma/client'
import { hashPassword, comparePassword } from '../../utils/hash'
import { signToken } from '../../utils/jwt'
import { logAction } from '../../utils/logger'
import crypto from 'crypto'

const prisma = new PrismaClient()

// ─── UC01: Kiểm tra đã có Admin chưa ───────────────────────
export const checkAdminExists = async () => {
  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } })
  if (!adminRole) return false
  const count = await prisma.userRole.count({ where: { roleId: adminRole.id } })
  return count > 0
}

// ─── UC01: Tạo Admin lần đầu ────────────────────────────────
export const setupAdmin = async (data: {
  fullName: string
  username: string
  email: string
  password: string
}, ip: string) => {
  const hashedPw = await hashPassword(data.password)

  // Tạo role ADMIN nếu chưa có, đồng thời seed 4 roles
  await prisma.role.createMany({
    data: [
      { name: 'ADMIN' },
      { name: 'DOCTOR' },
      { name: 'RECEPTIONIST' },
      { name: 'ACCOUNTANT' },
    ],
    skipDuplicates: true
  })

  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } })

  const user = await prisma.user.create({
    data: {
      fullName: data.fullName,
      username: data.username,
      email: data.email,
      password: hashedPw,
      roles: { create: { roleId: adminRole!.id } }
    }
  })

  await logAction('SETUP_ADMIN', `Admin đầu tiên được tạo: ${data.username}`, user.id, ip)
  return user
}

// ─── UC02: Đăng nhập ────────────────────────────────────────
export const login = async (
  username: string,
  password: string,
  ip: string
) => {
  const user = await prisma.user.findUnique({
    where: { username },
    include: { roles: { include: { role: true } } }
  })

  if (!user) throw new Error('INVALID_CREDENTIALS')

  // Kiểm tra khóa tài khoản
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new Error('ACCOUNT_LOCKED')
  }

  // Kiểm tra tài khoản active
  if (!user.isActive) throw new Error('ACCOUNT_DISABLED')

  const isValid = await comparePassword(password, user.password)

  if (!isValid) {
    // Tăng số lần đăng nhập sai
    const attempts = user.loginAttempts + 1
    const lockData = attempts >= 5
      ? { loginAttempts: 0, lockedUntil: new Date(Date.now() + 15 * 60 * 1000) }
      : { loginAttempts: attempts }

    await prisma.user.update({ where: { id: user.id }, data: lockData })
    throw new Error('INVALID_CREDENTIALS')
  }

  // Reset login attempts
  await prisma.user.update({
    where: { id: user.id },
    data: { loginAttempts: 0, lockedUntil: null }
  })

  const roles = user.roles.map(r => r.role.name)
  const token = signToken({ userId: user.id, roles })

  await logAction('LOGIN', `Đăng nhập thành công`, user.id, ip)

  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      roles
    }
  }
}

// ─── UC03: Đổi mật khẩu ─────────────────────────────────────
export const changePassword = async (
  userId: number,
  currentPassword: string,
  newPassword: string,
  ip: string
) => {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new Error('USER_NOT_FOUND')

  const isValid = await comparePassword(currentPassword, user.password)
  if (!isValid) throw new Error('WRONG_PASSWORD')

  const isSame = await comparePassword(newPassword, user.password)
  if (isSame) throw new Error('SAME_PASSWORD')

  const hashed = await hashPassword(newPassword)
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } })

  // Xóa tất cả refresh token
  await prisma.refreshToken.deleteMany({ where: { userId } })

  await logAction('CHANGE_PASSWORD', 'Đổi mật khẩu thành công', userId, ip)
}

// ─── UC04: Quên mật khẩu ────────────────────────────────────
export const requestPasswordReset = async (email: string, ip: string) => {
  const user = await prisma.user.findUnique({ where: { email } })
  // Không tiết lộ email có tồn tại hay không
  if (!user) return null

  // Giới hạn 3 lần / 15 phút
  const recentRequests = await prisma.passwordResetToken.count({
    where: {
      userId: user.id,
      createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }
    }
  })
  if (recentRequests >= 3) throw new Error('RATE_LIMIT')

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 phút

  await prisma.passwordResetToken.create({
    data: { token, userId: user.id, expiresAt }
  })

  await logAction('REQUEST_RESET_PASSWORD', `Yêu cầu đặt lại mật khẩu`, user.id, ip)
  return { token, email: user.email }
}

export const resetPassword = async (token: string, newPassword: string) => {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } })

  if (!record) throw new Error('INVALID_TOKEN')
  if (record.used) throw new Error('TOKEN_USED')
  if (record.expiresAt < new Date()) throw new Error('TOKEN_EXPIRED')

  const hashed = await hashPassword(newPassword)
  await prisma.user.update({ where: { id: record.userId }, data: { password: hashed } })
  await prisma.passwordResetToken.update({ where: { id: record.id }, data: { used: true } })
  await prisma.refreshToken.deleteMany({ where: { userId: record.userId } })

  await logAction('RESET_PASSWORD', 'Đặt lại mật khẩu thành công', record.userId)
}