import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const ACTION_MODULE: Record<string, string> = {
  SETUP_ADMIN:          'Auth',
  REGISTER_ADMIN:       'Auth',
  LOGIN:                'Auth',
  LOGIN_FAILED:         'Auth',
  LOGOUT:               'Auth',
  CHANGE_PASSWORD:      'Auth',
  REQUEST_RESET_PASSWORD: 'Auth',
  RESET_PASSWORD:       'Auth',
  CREATE_STAFF:         'User',
  UPDATE_ROLES:         'User',
  TOGGLE_STATUS:        'User',
  DELETE_USER:          'User',
  UPDATE_PROFILE:       'User',
  ADMIN_RESET_PASSWORD: 'User',
  SEND_EMAIL:           'User',
  UPLOAD_CERTIFICATE:   'User',
  DELETE_CERTIFICATE:   'User',
}

export const logAction = async (
  action: string,
  detail?: string,
  userId?: number,
  ip?: string,
  status: 'SUCCESS' | 'FAILED' = 'SUCCESS'
) => {
  try {
    const module = ACTION_MODULE[action] ?? 'System'
    await prisma.systemLog.create({
      data: { action, detail, userId, ip, status, module }
    })
  } catch {
    console.error('[Logger] Failed to write log:', action)
  }
}
