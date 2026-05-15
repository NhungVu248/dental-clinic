import { PrismaClient } from '@prisma/client'
import { logAction } from '../../utils/logger'

const prisma = new PrismaClient()

export const getDoctors = async () => {
  return prisma.user.findMany({
    where: {
      isActive: true,
      roles: { some: { role: { name: 'DOCTOR' } } },
    },
    select: { id: true, fullName: true },
    orderBy: { fullName: 'asc' },
  })
}

export const getServiceGroups = async (search?: string) => {
  const groups = await prisma.serviceGroup.findMany({
    where: search ? { name: { contains: search } } : undefined,
    include: {
      doctors: {
        include: {
          doctor: { select: { id: true, fullName: true } },
        },
      },
      _count: { select: { services: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  return groups.map(g => ({
    id: g.id,
    name: g.name,
    description: g.description,
    serviceCount: g._count.services,
    doctors: g.doctors.map(d => ({ id: d.doctor.id, fullName: d.doctor.fullName })),
  }))
}

export const createServiceGroup = async (
  data: { name: string; description?: string; doctorIds: number[] },
  adminId: number,
  ip: string
) => {
  if (!data.name?.trim()) throw { status: 400, message: 'Tên nhóm không được để trống' }
  if (!data.doctorIds || data.doctorIds.length === 0)
    throw { status: 400, message: 'Phải chọn ít nhất một bác sĩ đảm nhiệm' }

  const existing = await prisma.serviceGroup.findUnique({ where: { name: data.name.trim() } })
  if (existing) throw { status: 409, message: 'Tên nhóm dịch vụ đã tồn tại' }

  const group = await prisma.serviceGroup.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      doctors: {
        create: data.doctorIds.map(id => ({ doctorId: id })),
      },
    },
  })

  await logAction('CREATE_SERVICE_GROUP', `Tạo nhóm dịch vụ: ${group.name}`, adminId, ip)
  return group
}

export const updateServiceGroup = async (
  id: number,
  data: { name?: string; description?: string; doctorIds?: number[] },
  adminId: number,
  ip: string
) => {
  const group = await prisma.serviceGroup.findUnique({ where: { id } })
  if (!group) throw { status: 404, message: 'Không tìm thấy nhóm dịch vụ' }

  if (data.name && data.name.trim() !== group.name) {
    const dup = await prisma.serviceGroup.findUnique({ where: { name: data.name.trim() } })
    if (dup) throw { status: 409, message: 'Tên nhóm dịch vụ đã tồn tại' }
  }

  if (data.doctorIds !== undefined && data.doctorIds.length === 0)
    throw { status: 400, message: 'Phải chọn ít nhất một bác sĩ đảm nhiệm' }

  await prisma.$transaction(async tx => {
    await tx.serviceGroup.update({
      where: { id },
      data: {
        name: data.name?.trim() ?? group.name,
        description: data.description !== undefined ? (data.description?.trim() || null) : group.description,
      },
    })
    if (data.doctorIds !== undefined) {
      await tx.serviceGroupDoctor.deleteMany({ where: { serviceGroupId: id } })
      await tx.serviceGroupDoctor.createMany({
        data: data.doctorIds.map(dId => ({ serviceGroupId: id, doctorId: dId })),
      })
    }
  })

  await logAction('UPDATE_SERVICE_GROUP', `Cập nhật nhóm dịch vụ: ${group.name}`, adminId, ip)
}

export const deleteServiceGroup = async (id: number, adminId: number, ip: string) => {
  const group = await prisma.serviceGroup.findUnique({
    where: { id },
    include: { _count: { select: { services: true } } },
  })
  if (!group) throw { status: 404, message: 'Không tìm thấy nhóm dịch vụ' }

  if (group._count.services > 0)
    throw {
      status: 400,
      message: `Không thể xóa nhóm còn ${group._count.services} dịch vụ. Vui lòng chuyển hoặc ngừng tất cả dịch vụ trước.`,
    }

  await prisma.serviceGroup.delete({ where: { id } })
  await logAction('DELETE_SERVICE_GROUP', `Xóa nhóm dịch vụ: ${group.name}`, adminId, ip)
}

export const getGroupServices = async (id: number) => {
  const group = await prisma.serviceGroup.findUnique({ where: { id } })
  if (!group) throw { status: 404, message: 'Không tìm thấy nhóm dịch vụ' }

  const services = await prisma.service.findMany({
    where: { serviceGroupId: id },
    orderBy: { code: 'asc' },
    select: { id: true, code: true, name: true, isActive: true },
  })

  return { groupName: group.name, services }
}
