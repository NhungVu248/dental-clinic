import { api } from './auth.api'

export interface Holiday {
  id:            number
  name:          string
  startDate:     string  // "YYYY-MM-DD"
  endDate:       string  // "YYYY-MM-DD" (inclusive)
  type:          'NATIONAL' | 'PRIVATE' | 'RECURRING'
  sendSms:       boolean
  autoCancel:    boolean
  conflictCount: number  // future: appointments in this period
  createdAt:     string
  updatedAt:     string
}

export interface HolidayInput {
  name:       string
  startDate:  string
  endDate:    string
  type:       string
  sendSms:    boolean
  autoCancel: boolean
}

export const holidayApi = {
  getAll:  (year?: number) =>
    api.get<Holiday[]>('/holidays', { params: year ? { year } : undefined }),
  create:  (data: HolidayInput) =>
    api.post<Holiday>('/holidays', data),
  update:  (id: number, data: Partial<HolidayInput>) =>
    api.put<{ message: string }>(`/holidays/${id}`, data),
  remove:  (id: number) =>
    api.delete<{ message: string }>(`/holidays/${id}`),
}
