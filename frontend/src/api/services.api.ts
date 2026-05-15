import { api } from './auth.api'

export interface Doctor {
  id: number
  fullName: string
}

export interface ServiceGroup {
  id: number
  name: string
  description: string | null
  serviceCount: number
  doctors: Doctor[]
}

export interface GroupService {
  id: number
  code: string
  name: string
  isActive: boolean
}

export const serviceApi = {
  getDoctors: () => api.get<Doctor[]>('/services/doctors'),

  getGroups: (search?: string) =>
    api.get<ServiceGroup[]>('/services/groups', { params: search ? { search } : undefined }),

  createGroup: (data: { name: string; description?: string; doctorIds: number[] }) =>
    api.post('/services/groups', data),

  updateGroup: (id: number, data: { name?: string; description?: string; doctorIds?: number[] }) =>
    api.put(`/services/groups/${id}`, data),

  deleteGroup: (id: number) => api.delete(`/services/groups/${id}`),

  getGroupServices: (id: number) =>
    api.get<{ groupName: string; services: GroupService[] }>(`/services/groups/${id}/services`),
}
