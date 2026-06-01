import { PrismaClient } from '@prisma/client'
import { logAction } from '../../utils/logger'

const prisma = new PrismaClient()

export const TYPE_LABELS: Record<string, string> = {
  NATIONAL:  'Ngày lễ quốc gia',
  PRIVATE:   'Ngày nghỉ riêng',
  RECURRING: 'Hằng năm',
}

// ─── Date helpers ────────────────────────────────────────────

/** "YYYY-MM-DD" → Date stored at UTC midnight */
const toUTC = (dateStr: string): Date => new Date(dateStr + 'T00:00:00.000Z')

/** Date → "YYYY-MM-DD" (UTC) */
const toStr = (d: Date): string => d.toISOString().slice(0, 10)

/** Today at UTC midnight for comparison */
const todayUTC = (): Date => {
  const d = new Date()
  d.setUTCHours(0, 0, 0, 0)
  return d
}

// ─── Shape returned to frontend ──────────────────────────────

const shape = (h: {
  id: number; name: string; startDate: Date; endDate: Date;
  type: string; sendSms: boolean; autoCancel: boolean;
  createdAt: Date; updatedAt: Date;
}) => ({
  id:            h.id,
  name:          h.name,
  startDate:     toStr(h.startDate),
  endDate:       toStr(h.endDate),
  type:          h.type,
  sendSms:       h.sendSms,
  autoCancel:    h.autoCancel,
  conflictCount: 0, // placeholder — appointments module not yet built
  createdAt:     h.createdAt.toISOString(),
  updatedAt:     h.updatedAt.toISOString(),
})

// ─── UC07 CRUD ───────────────────────────────────────────────

export const getHolidays = async (year?: number) => {
  const y     = year ?? new Date().getFullYear()
  const start = new Date(`${y}-01-01T00:00:00.000Z`)
  const end   = new Date(`${y}-12-31T23:59:59.999Z`)

  const rows = await prisma.holiday.findMany({
    where: { startDate: { gte: start, lte: end } },
    orderBy: { startDate: 'asc' },
  })

  return rows.map(shape)
}

export const createHoliday = async (
  data: {
    name: string
    startDate: string
    endDate: string
    type: string
    sendSms: boolean
    autoCancel: boolean
  },
  adminId: number,
  ip: string
) => {
  if (!data.name?.trim())  throw { status: 400, message: 'Tên ngày nghỉ không được để trống' }
  if (!data.startDate)     throw { status: 400, message: 'Vui lòng chọn ngày bắt đầu' }
  if (!data.endDate)       throw { status: 400, message: 'Vui lòng chọn ngày kết thúc' }
  if (data.endDate < data.startDate)
    throw { status: 400, message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu' }
  if (!TYPE_LABELS[data.type])
    throw { status: 400, message: 'Loại ngày nghỉ không hợp lệ' }

  const row = await prisma.holiday.create({
    data: {
      name:       data.name.trim(),
      startDate:  toUTC(data.startDate),
      endDate:    toUTC(data.endDate),
      type:       data.type,
      sendSms:    data.sendSms    ?? false,
      autoCancel: data.autoCancel ?? false,
      createdBy:  adminId,
    },
  })

  await logAction(
    'CREATE_HOLIDAY',
    `Thêm ngày nghỉ: ${row.name} (${data.startDate} – ${data.endDate}) [${TYPE_LABELS[data.type]}]`,
    adminId,
    ip
  )
  return shape(row)
}

export const updateHoliday = async (
  id: number,
  data: {
    name?: string
    startDate?: string
    endDate?: string
    type?: string
    sendSms?: boolean
    autoCancel?: boolean
  },
  adminId: number,
  ip: string
) => {
  const row = await prisma.holiday.findUnique({ where: { id } })
  if (!row) throw { status: 404, message: 'Không tìm thấy ngày nghỉ' }

  // E1: cannot edit holidays that have fully passed
  if (row.endDate < todayUTC())
    throw { status: 400, message: 'Không thể chỉnh sửa ngày nghỉ đã qua (E1)' }

  const newStart = data.startDate ?? toStr(row.startDate)
  const newEnd   = data.endDate   ?? toStr(row.endDate)
  if (newEnd < newStart)
    throw { status: 400, message: 'Ngày kết thúc phải sau hoặc bằng ngày bắt đầu' }

  if (data.type && !TYPE_LABELS[data.type])
    throw { status: 400, message: 'Loại ngày nghỉ không hợp lệ' }

  await prisma.holiday.update({
    where: { id },
    data: {
      name:       data.name !== undefined  ? data.name.trim() : row.name,
      startDate:  data.startDate           ? toUTC(data.startDate)  : row.startDate,
      endDate:    data.endDate             ? toUTC(data.endDate)    : row.endDate,
      type:       data.type               ?? row.type,
      sendSms:    data.sendSms            !== undefined ? data.sendSms    : row.sendSms,
      autoCancel: data.autoCancel         !== undefined ? data.autoCancel : row.autoCancel,
    },
  })

  await logAction('UPDATE_HOLIDAY', `Cập nhật ngày nghỉ: ${row.name}`, adminId, ip)
}

export const deleteHoliday = async (id: number, adminId: number, ip: string) => {
  const row = await prisma.holiday.findUnique({ where: { id } })
  if (!row) throw { status: 404, message: 'Không tìm thấy ngày nghỉ' }

  // E1: cannot delete past holidays (history integrity)
  if (row.endDate < todayUTC())
    throw { status: 400, message: 'Không thể xóa ngày nghỉ đã qua để bảo toàn dữ liệu lịch sử (E1)' }

  await prisma.holiday.delete({ where: { id } })
  await logAction('DELETE_HOLIDAY', `Xóa ngày nghỉ: ${row.name} (${toStr(row.startDate)})`, adminId, ip)
}
