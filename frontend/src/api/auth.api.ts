import axios from 'axios'

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
})

// Tự động gắn token vào header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth APIs
export const authApi = {
  checkSetup:     () => api.get('/auth/check-setup'),
  setup:          (data: any) => api.post('/auth/setup', data),
  register:       (data: any) => api.post('/auth/register', data),
  login:          (data: any) => api.post('/auth/login', data),
  changePassword: (data: any) => api.post('/auth/change-password', data),
  forgotPassword: (data: any) => api.post('/auth/forgot-password', data),
  resetPassword:  (data: any) => api.post('/auth/reset-password', data),
  getUsers:       () => api.get('/auth/users'),
  toggleStatus:   (id: number, isActive: boolean) => api.patch(`/auth/users/${id}/status`, { isActive }),
  deleteUser:     (id: number) => api.delete(`/auth/users/${id}`),
}