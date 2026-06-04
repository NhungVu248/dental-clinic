import { PrismaClient } from '@prisma/client'
import { updateAppointmentStatus } from '../receptionist/receptionist.service'

const prisma = new PrismaClient()

const pad2 = (n: number) => String(n).padStart(2, '0')

function getWeekMonday(dateStr: string): Date {
  const d = new Date(dateStr + 'T00:00:00.000Z')
  const dow = d.getUTCDay()
  d.setUTCDate(d.getUTCDate() - (dow === 0 ? 6 : dow - 1))
  return d
}

function isoWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day  = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

function generateSlotTimes(startTime: string, endTime: string, slotDuration: number, bufferTime: number): string[] {
  const [sH, sM] = startTime.split(':').map(Number)
  const [eH, eM] = endTime.split(':').map(Number)
  const endMins  = eH * 60 + eM
  const times: string[] = []
  let h = sH, m = sM
  while (h * 60 + m < endMins) {
    times.push(`${pad2(h)}:${pad2(m)}`)
    m += slotDuration + bufferTime
    if (m >= 60) { h += Math.floor(m / 60); m %= 60 }
  }
  return times
}

function aptInShift(aptDate: Date, shiftStart: string, shiftEnd: string): boolean {
  const [sH, sM] = shiftStart.split(':').map(Number)
  const [eH, eM] = shiftEnd.split(':').map(Number)
  const mins = aptDate.getHours() * 60 + aptDate.getMinutes()
  return mins >= sH * 60 + sM && mins < eH * 60 + eM
}

const DAY_LABELS  = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const LABELS_FULL = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316',
  '#14b8a6', '#22c55e', '#ef4444', '#0ea5e9',
]

function buildWeekDays(mon: Date, todayUTC: Date) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon); d.setUTCDate(mon.getUTCDate() + i)
    const jsDay  = d.getUTCDay()
    const dateStr = d.toISOString().slice(0, 10)
    return {
      date:        dateStr,
      dayLabel:    DAY_LABELS[jsDay],
      fullLabel:   LABELS_FULL[jsDay],
      displayDate: `${d.getUTCDate()}/${d.getUTCMonth() + 1}`,
      isToday:     d.getTime() === todayUTC.getTime(),
      isPast:      d < todayUTC,
    }
  })
}

// ─── My Schedule ─────────────────────────────────────────────

export const getMySchedule = async (doctorId: number, weekStart: string) => {
  const mon      = getWeekMonday(weekStart)
  const sun      = new Date(mon); sun.setUTCDate(mon.getUTCDate() + 6); sun.setUTCHours(23, 59, 59, 999)
  const todayUTC = new Date(); todayUTC.setUTCHours(0, 0, 0, 0)
  const now      = new Date()

  const weekDays = buildWeekDays(mon, todayUTC)

  const [schedules, appointments, doctorInfo] = await Promise.all([
    prisma.doctorSchedule.findMany({
      where:   { doctorId, workDate: { gte: mon, lte: sun } },
      include: {
        shift:        true,
        serviceGroup: { select: { id: true, name: true } },
      },
      orderBy: [{ workDate: 'asc' }, { shift: { startTime: 'asc' } }],
    }),
    prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: { gte: mon, lte: sun },
        status: { notIn: ['CANCELLED', 'ABSENT'] },
      },
      select: { appointmentDate: true },
    }),
    prisma.user.findUnique({
      where:  { id: doctorId },
      select: {
        fullName:      true,
        serviceGroups: {
          include: { serviceGroup: { select: { id: true, name: true } } },
        },
      },
    }),
  ])

  const myGroups = (doctorInfo?.serviceGroups ?? []).map(sg => ({
    id:   sg.serviceGroup.id,
    name: sg.serviceGroup.name,
  }))

  const mySchedule = weekDays.map(wd => {
    const dayScheds = schedules.filter(s => {
      const sd = new Date(s.workDate); sd.setUTCHours(0, 0, 0, 0)
      return sd.toISOString().slice(0, 10) === wd.date
    })

    const dayStart = new Date(wd.date + 'T00:00:00')
    const dayEnd   = new Date(wd.date + 'T23:59:59')
    const dayApts  = appointments.filter(a => {
      const ad = new Date(a.appointmentDate)
      return ad >= dayStart && ad <= dayEnd
    })

    const shifts = dayScheds.map(sch => {
      const sh        = sch.shift
      const slotTimes = generateSlotTimes(sh.startTime, sh.endTime, sh.slotDuration, sh.bufferTime)
      const maxEff    = sh.maxPatients - sh.reserveSlots

      const shiftApts   = dayApts.filter(a => aptInShift(new Date(a.appointmentDate), sh.startTime, sh.endTime))
      const bookedCount = shiftApts.length
      const freeCount   = Math.max(0, maxEff - bookedCount)
      const pct         = maxEff > 0 ? bookedCount / maxEff : 0

      return {
        scheduleId:       sch.id,
        shiftId:          sh.id,
        shiftName:        sh.name,
        startTime:        sh.startTime,
        endTime:          sh.endTime,
        colorCode:        sh.colorCode,
        maxPatients:      maxEff,
        totalSlots:       slotTimes.length,
        bookedCount,
        freeCount,
        serviceGroupId:   sch.serviceGroupId,
        serviceGroupName: sch.serviceGroup?.name ?? null,
        note:             sch.note,
        isOverride:       sch.isOverride,
        status: pct >= 1 ? 'FULL' : bookedCount > 0 ? 'BUSY' : 'FREE',
      }
    })

    return {
      ...wd,
      shifts,
      totalBooked: shifts.reduce((s, sh) => s + sh.bookedCount, 0),
      totalFree:   shifts.reduce((s, sh) => s + sh.freeCount, 0),
    }
  })

  return {
    weekNumber:    isoWeekNumber(mon),
    weekStart:     mon.toISOString().slice(0, 10),
    updatedAt:     now.toISOString(),
    weekDays,
    mySchedule,
    serviceGroups: myGroups,
    weekStats: {
      totalShifts: schedules.length,
      totalBooked: mySchedule.reduce((s, d) => s + d.totalBooked, 0),
      totalFree:   mySchedule.reduce((s, d) => s + d.totalFree, 0),
    },
  }
}

// ─── Group Schedule ───────────────────────────────────────────

export const getGroupSchedule = async (doctorId: number, weekStart: string) => {
  const mon      = getWeekMonday(weekStart)
  const sun      = new Date(mon); sun.setUTCDate(mon.getUTCDate() + 6); sun.setUTCHours(23, 59, 59, 999)
  const todayUTC = new Date(); todayUTC.setUTCHours(0, 0, 0, 0)
  const now      = new Date()

  const doctorWithGroups = await prisma.user.findUnique({
    where:  { id: doctorId },
    select: {
      serviceGroups: {
        include: {
          serviceGroup: {
            include: {
              doctors: {
                include: { doctor: { select: { id: true, fullName: true } } },
              },
            },
          },
        },
      },
    },
  })

  if (!doctorWithGroups) throw { status: 404, message: 'Bác sĩ không tồn tại' }

  const myGroups     = doctorWithGroups.serviceGroups.map(sg => sg.serviceGroup)
  const groupsSimple = myGroups.map(g => ({ id: g.id, name: g.name }))

  const allDoctorIdSet = new Set<number>([doctorId])
  for (const g of myGroups)
    for (const d of g.doctors)
      allDoctorIdSet.add(d.doctorId)

  const allDoctorIds = [...allDoctorIdSet]
  const weekDays     = buildWeekDays(mon, todayUTC)

  const [schedules, appointments, allDoctorUsers] = await Promise.all([
    prisma.doctorSchedule.findMany({
      where:   { doctorId: { in: allDoctorIds }, workDate: { gte: mon, lte: sun } },
      include: {
        doctor:       { select: { id: true, fullName: true } },
        shift:        true,
        serviceGroup: { select: { id: true, name: true } },
      },
      orderBy: [{ workDate: 'asc' }, { shift: { startTime: 'asc' } }],
    }),
    prisma.appointment.findMany({
      where: {
        doctorId:        { in: allDoctorIds },
        appointmentDate: { gte: mon, lte: sun },
        status:          { notIn: ['CANCELLED', 'ABSENT'] },
      },
      select: { doctorId: true, appointmentDate: true },
    }),
    prisma.user.findMany({
      where:   { id: { in: allDoctorIds } },
      select: {
        id: true, fullName: true,
        serviceGroups: {
          include: { serviceGroup: { select: { id: true, name: true } } },
        },
      },
      orderBy: { fullName: 'asc' },
    }),
  ])

  // Per-doctor|date|shift booking count
  const bookedPerShift = new Map<string, number>()
  for (const apt of appointments) {
    if (!apt.doctorId) continue
    const ad      = new Date(apt.appointmentDate)
    const dateStr = `${ad.getFullYear()}-${pad2(ad.getMonth()+1)}-${pad2(ad.getDate())}`
    const matchedSch = schedules.find(sch => {
      if (sch.doctorId !== apt.doctorId) return false
      const sd    = new Date(sch.workDate)
      const sdStr = `${sd.getFullYear()}-${pad2(sd.getMonth()+1)}-${pad2(sd.getDate())}`
      return sdStr === dateStr && aptInShift(ad, sch.shift.startTime, sch.shift.endTime)
    })
    if (matchedSch) {
      const key = `${apt.doctorId}|${dateStr}|${matchedSch.shiftId}`
      bookedPerShift.set(key, (bookedPerShift.get(key) ?? 0) + 1)
    }
  }

  const doctorRows = allDoctorUsers.map((d, idx) => {
    const specialty = d.serviceGroups[0]?.serviceGroup?.name ?? 'Bác sĩ'
    const initials  = d.fullName.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()
    const isMe      = d.id === doctorId
    const docGroupIds = new Set(d.serviceGroups.map(sg => sg.serviceGroup.id))
    const sharedGroups = groupsSimple.filter(g => docGroupIds.has(g.id))

    const days: Record<string, {
      scheduleId: number; shiftId: number; shiftName: string
      startTime: string; endTime: string; colorCode: string
      maxPatients: number; bookedCount: number; serviceGroupName: string | null
    }[]> = {}

    for (const wd of weekDays) {
      const dayScheds = schedules.filter(s => {
        const sd    = new Date(s.workDate)
        const sdStr = `${sd.getFullYear()}-${pad2(sd.getMonth()+1)}-${pad2(sd.getDate())}`
        return sdStr === wd.date && s.doctorId === d.id
      })
      if (dayScheds.length > 0) {
        days[wd.date] = dayScheds.map(s => {
          const bKey   = `${d.id}|${wd.date}|${s.shiftId}`
          const maxEff = s.shift.maxPatients - s.shift.reserveSlots
          return {
            scheduleId:       s.id,
            shiftId:          s.shiftId,
            shiftName:        s.shift.name,
            startTime:        s.shift.startTime,
            endTime:          s.shift.endTime,
            colorCode:        s.shift.colorCode,
            maxPatients:      maxEff,
            bookedCount:      bookedPerShift.get(bKey) ?? 0,
            serviceGroupName: s.serviceGroup?.name ?? null,
          }
        })
      }
    }

    return {
      id: d.id, name: d.fullName, specialty, initials,
      avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
      isMe, sharedGroups, days,
    }
  })

  return {
    weekNumber:    isoWeekNumber(mon),
    weekStart:     mon.toISOString().slice(0, 10),
    updatedAt:     now.toISOString(),
    weekDays,
    doctors:       doctorRows,
    serviceGroups: groupsSimple,
  }
}

// ─── My Appointments List ────────────────────────────────────

export type AptView = 'day' | 'week' | 'month'

function dateRange(view: AptView, refDate: string): { start: Date; end: Date } {
  const base = new Date(refDate + 'T00:00:00')
  if (view === 'day') {
    const end = new Date(base); end.setHours(23, 59, 59, 999)
    return { start: base, end }
  }
  if (view === 'week') {
    const dow  = base.getDay()
    const mon  = new Date(base); mon.setDate(base.getDate() - (dow === 0 ? 6 : dow - 1))
    const sun  = new Date(mon);  sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59, 999)
    return { start: mon, end: sun }
  }
  // month
  const start = new Date(base.getFullYear(), base.getMonth(), 1)
  const end   = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export const listMyAppointments = async (
  doctorId: number,
  params: {
    view?:   AptView
    date?:   string
    status?: string
    search?: string
    page?:   number
    limit?:  number
  },
) => {
  const view  = params.view  ?? 'day'
  const today = new Date()
  const pad   = (n: number) => String(n).padStart(2, '0')
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`
  const refDate  = params.date ?? todayStr
  const page     = Math.max(1, params.page  ?? 1)
  const limit    = Math.min(50, params.limit ?? 50)
  const skip     = (page - 1) * limit

  const { start, end } = dateRange(view, refDate)

  // Build where clause
  const where: Record<string, unknown> = {
    doctorId,
    appointmentDate: { gte: start, lte: end },
  }
  if (params.status && params.status !== 'ALL') where.status = params.status
  if (params.search?.trim()) {
    const q = params.search.trim()
    where.OR = [
      { code:        { contains: q } },
      { patientName: { contains: q } },
      { patientPhone:{ contains: q } },
    ]
    delete where.appointmentDate
    where.AND = [
      { appointmentDate: { gte: start, lte: end } },
      { OR: where.OR },
    ]
    delete where.OR
  }

  const [total, items, statusGroups] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      orderBy: { appointmentDate: 'asc' },
      skip,
      take: limit,
      include: {
        service: { select: { id: true, name: true } },
      },
    }),
    prisma.appointment.groupBy({
      by: ['status'],
      where: { doctorId, appointmentDate: { gte: start, lte: end } },
      _count: { id: true },
    }),
  ])

  const statusCounts = Object.fromEntries(statusGroups.map(g => [g.status, g._count.id]))

  return {
    items: items.map(a => ({
      id:              a.id,
      code:            a.code,
      patientName:     a.patientName,
      patientPhone:    a.patientPhone,
      patientDob:      a.patientDob ? a.patientDob.toISOString().slice(0, 10) : null,
      patientGender:   a.patientGender,
      note:            a.note,
      cancelReason:    a.cancelReason,
      status:          a.status,
      appointmentDate: a.appointmentDate.toISOString(),
      serviceId:       a.serviceId,
      serviceName:     a.service?.name ?? null,
      createdAt:       a.createdAt.toISOString(),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    statusCounts,
    refDate,
    view,
  }
}

// Re-export so controller can call it
export { updateAppointmentStatus as patchStatus }
