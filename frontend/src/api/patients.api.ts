import { api } from './auth.api'

// ─── Types ────────────────────────────────────────────────────

export const CLASSIFICATION_META: Record<string, { label: string; color: string; bg: string }> = {
  NEW:      { label: 'Mới',               color: '#2563eb', bg: '#eff6ff' },
  VIP:      { label: 'VIP',               color: '#b45309', bg: '#fef9c3' },
  RETURNING:{ label: 'Tái khám',          color: '#059669', bg: '#ecfdf5' },
  SPECIAL:  { label: 'Theo dõi đặc biệt', color: '#dc2626', bg: '#fff1f2' },
}

export interface PatientRow {
  id:             number
  code:           string
  fullName:       string
  dateOfBirth:    string
  gender:         string
  phone:          string
  nationalId:     string | null
  classification: string
  isComplete:     boolean
  isActive:       boolean
  lastVisit:      string | null
  createdAt:      string
}

export interface PatientDetail extends PatientRow {
  bhytCode:              string | null
  address:               string | null
  occupation:            string | null
  emergencyContactName:  string | null
  emergencyContactPhone: string | null
  adminNote:             string | null
  appointments: {
    id:             number
    code:           string
    appointmentDate: string
    status:         string
    doctor:  { fullName: string } | null
    service: { name: string }     | null
  }[]
}

export interface AppointmentHit {
  id:            number
  code:          string
  patientName:   string
  patientPhone:  string
  patientDob:    string | null
  patientGender: string | null
  appointmentDate: string
}

export interface ListPatientsResponse {
  patients:        PatientRow[]
  total:           number
  page:            number
  limit:           number
  totalPages:      number
  appointmentHits: AppointmentHit[]
}

export interface CreatePatientPayload {
  fullName:              string
  dateOfBirth:           string
  gender:                string
  phone:                 string
  nationalId?:           string
  bhytCode?:             string
  address?:              string
  occupation?:           string
  emergencyContactName?: string
  emergencyContactPhone?:string
  adminNote?:            string
  appointmentId?:        number
}

export interface DuplicateError {
  message:   string
  duplicate: { type: 'NATIONAL_ID' | 'PHONE'; patient: { id: number; code: string; fullName: string; phone: string } }
}

// ─── API ──────────────────────────────────────────────────────

export const patientsApi = {
  list: (params: { q?: string; page?: number; limit?: number }) =>
    api.get<ListPatientsResponse>('/patients', { params }),

  get: (id: number) =>
    api.get<PatientDetail>(`/patients/${id}`),

  create: (body: CreatePatientPayload) =>
    api.post<PatientDetail>('/patients', body),

  update: (id: number, body: Partial<CreatePatientPayload>) =>
    api.put<PatientDetail>(`/patients/${id}`, body),

  deactivate: (id: number) =>
    api.patch(`/patients/${id}/deactivate`),
}
