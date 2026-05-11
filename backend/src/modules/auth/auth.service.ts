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

// ─── Đăng ký Admin tự do ────────────────────────────────────
export const registerAdmin = async (data: {
  fullName: string
  username: string
  email: string
  password: string
}, ip: string) => {
  const hashedPw = await hashPassword(data.password)

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

  await logAction('REGISTER_ADMIN', `Admin tự đăng ký: ${data.username}`, user.id, ip)
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

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new Error('ACCOUNT_LOCKED')
  }

  if (!user.isActive) throw new Error('ACCOUNT_DISABLED')

  const isValid = await comparePassword(password, user.password)

  if (!isValid) {
    const attempts = user.loginAttempts + 1
    const lockData = attempts >= 5
      ? { loginAttempts: 0, lockedUntil: new Date(Date.now() + 15 * 60 * 1000) }
      : { loginAttempts: attempts }

    await prisma.user.update({ where: { id: user.id }, data: lockData })
    throw new Error('INVALID_CREDENTIALS')
  }

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
  await prisma.refreshToken.deleteMany({ where: { userId } })
  await logAction('CHANGE_PASSWORD', 'Đổi mật khẩu thành công', userId, ip)
}

// ─── UC04: Quên mật khẩu ────────────────────────────────────
export const requestPasswordReset = async (email: string, ip: string) => {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return null

  const recentRequests = await prisma.passwordResetToken.count({
    where: {
      userId: user.id,
      createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) }
    }
  })
  if (recentRequests >= 3) throw new Error('RATE_LIMIT')

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

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

// ─── Lấy danh sách tài khoản ────────────────────────────────
export const getUsers = async () => {
  return prisma.user.findMany({
    include: {
      roles: { include: { role: true } },
      _count: { select: { logs: true } }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// ─── Khóa / Mở tài khoản ────────────────────────────────────
export const toggleUserStatus = async (
  targetId: number,
  isActive: boolean,
  operatorId: number,
  ip: string
) => {
  const user = await prisma.user.findUnique({ where: { id: targetId } })
  if (!user) throw new Error('USER_NOT_FOUND')
  if (targetId === operatorId) throw new Error('CANNOT_SELF_LOCK')

  await prisma.user.update({ where: { id: targetId }, data: { isActive } })
  await logAction(
    isActive ? 'UNLOCK_USER' : 'LOCK_USER',
    `${isActive ? 'Mở' : 'Khóa'} tài khoản: ${user.username}`,
    operatorId, ip
  )
}

// ─── Xóa tài khoản (chỉ khi chưa có log) ───────────────────
export const deleteUser = async (
  targetId: number,
  operatorId: number,
  ip: string
) => {
  if (targetId === operatorId) throw new Error('CANNOT_SELF_DELETE')

  const logCount = await prisma.systemLog.count({ where: { userId: targetId } })
  if (logCount > 0) throw new Error('HAS_ACTIVITY_LOG')

  const user = await prisma.user.findUnique({ where: { id: targetId } })
  if (!user) throw new Error('USER_NOT_FOUND')

  await prisma.user.delete({ where: { id: targetId } })
  await logAction('DELETE_USER', `Xóa tài khoản: ${user.username}`, operatorId, ip)
}