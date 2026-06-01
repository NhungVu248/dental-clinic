import { api } from './auth.api'
import type { WorkShift } from './shifts.api'

export interface ScheduleItem {
  id:                number
  doctorId:          number
  doctorName:        string
  shiftId:           number
  shiftName:         string
  shiftStartTime:    string
  shiftEndTime:      string
  shiftColorCode:    string
  shiftMaxPatients:  number
  shiftSlotDuration: number
  shiftBufferTime:   number
  shiftReserveSlots: number
  workDate:          string   // "YYYY-MM-DD"
  serviceGroupId:    number | null
  serviceGroupName:  string | null
  note:              string | null
  isOverride:        boolean
  appointmentCount:  number
}

export interface FormDoctor {
  id:       number
  fullName: string
  groups:   { id: number; name: string }[]
}

export interface FormData {
  doctors: FormDoctor[]
  shifts:  WorkShift[]
  groups:  { id: number; name: string }[]
}

export type ScheduleInput = {
  doctorId:        number
  shiftId:         number
  workDate:        string
  serviceGroupId?: number | null
  note?:           string
  isOverride?:     boolean
}

export const scheduleApi = {
  getWeek:   (weekStart: string)                   => api.get<ScheduleItem[]>('/schedules', { params: { weekStart } }),
  getFormData: ()                                  => api.get<FormData>('/schedules/form-data'),
  create:    (data: ScheduleInput)                 => api.post<ScheduleItem>('/schedules', data),
  update:    (id: number, data: Partial<ScheduleInput & { isOverride: boolean }>) => api.put(`/schedules/${id}`, data),
  delete:    (id: number, isOverride?: boolean)    => api.delete(`/schedules/${id}`, { data: { isOverride } }),
}
