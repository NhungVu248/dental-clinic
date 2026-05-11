import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export const logAction = async (
  action: string,
  detail?: string,
  userId?: number,
  ip?: string
) => {
  try {
    await prisma.systemLog.create({
      data: { action, detail, userId, ip }
    })
  } catch {
    console.error('Log error')
  }
}