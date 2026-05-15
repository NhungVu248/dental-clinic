import { Request, Response } from 'express'
import * as svc from './service.service'

const getIp = (req: Request) =>
  (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
  req.socket.remoteAddress ||
  ''

export const getDoctors = async (_req: Request, res: Response) => {
  try {
    const doctors = await svc.getDoctors()
    res.json(doctors)
  } catch (e: any) {
    res.status(e.status || 500).json({ message: e.message || 'Lỗi hệ thống' })
  }
}

export const getServiceGroups = async (req: Request, res: Response) => {
  try {
    const { search } = req.query
    const groups = await svc.getServiceGroups(search as string | undefined)
    res.json(groups)
  } catch (e: any) {
    res.status(e.status || 500).json({ message: e.message || 'Lỗi hệ thống' })
  }
}

export const createServiceGroup = async (req: Request, res: Response) => {
  try {
    const group = await svc.createServiceGroup(req.body, (req as any).user.id, getIp(req))
    res.status(201).json(group)
  } catch (e: any) {
    res.status(e.status || 500).json({ message: e.message || 'Lỗi hệ thống' })
  }
}

export const updateServiceGroup = async (req: Request, res: Response) => {
  try {
    await svc.updateServiceGroup(Number(req.params.id), req.body, (req as any).user.id, getIp(req))
    res.json({ message: 'Cập nhật thành công' })
  } catch (e: any) {
    res.status(e.status || 500).json({ message: e.message || 'Lỗi hệ thống' })
  }
}

export const deleteServiceGroup = async (req: Request, res: Response) => {
  try {
    await svc.deleteServiceGroup(Number(req.params.id), (req as any).user.id, getIp(req))
    res.json({ message: 'Xóa thành công' })
  } catch (e: any) {
    res.status(e.status || 500).json({ message: e.message || 'Lỗi hệ thống' })
  }
}

export const getGroupServices = async (req: Request, res: Response) => {
  try {
    const data = await svc.getGroupServices(Number(req.params.id))
    res.json(data)
  } catch (e: any) {
    res.status(e.status || 500).json({ message: e.message || 'Lỗi hệ thống' })
  }
}
