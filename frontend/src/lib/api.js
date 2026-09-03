import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Request interceptor — attach access token ─────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ─── Response interceptor — refresh token rotation ────────────────────────
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error)
    else prom.resolve(token)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }).catch(err => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        // No refresh token — force logout
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefresh } = data.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefresh)
        api.defaults.headers.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshErr) {
        processQueue(refreshErr, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
}

// ─── Attendance ────────────────────────────────────────────────────────────
export const attendanceApi = {
  checkIn:    (data) => api.post('/attendance/check-in', data),
  checkOut:   (data) => api.post('/attendance/check-out', data),
  toggleDuty: (state) => api.post('/attendance/duty', { state }),
  getStatus:  () => api.get('/attendance/me'),
  getHistory: (params) => api.get('/attendance/history', { params }),
}

// ─── Location ──────────────────────────────────────────────────────────────
export const locationApi = {
  updateHeartbeat: (data) => api.post('/location/update', data),
  getLatest:       () => api.get('/location/latest'),
}

// ─── Employees ─────────────────────────────────────────────────────────────
export const employeesApi = {
  list:    (params) => api.get('/employees', { params }),
  get:     (id) => api.get(`/employees/${id}`),
  approve: (id, decision) => api.post(`/employees/${id}/approve`, { decision }),
}

// ─── HR Dashboard ──────────────────────────────────────────────────────────
export const hrApi = {
  getDashboard:  () => api.get('/hr/dashboard'),
  getAttendance: (params) => api.get('/hr/attendance', { params }),
}

// ─── Leaves ────────────────────────────────────────────────────────────────
export const leaveApi = {
  create:     (data) => api.post('/leaves', data),
  list:       (params) => api.get('/leaves', { params }),
  getBalance: () => api.get('/leaves/balance'),
  decide:     (id, decision) => api.post(`/leaves/${id}/decision`, { decision }),
}

// ─── Messages ──────────────────────────────────────────────────────────────
export const messagesApi = {
  send:        (recipientId, body) => api.post('/messages', { recipientId, body }),
  getInbox:    () => api.get('/messages/inbox'),
  getContacts: () => api.get('/messages/contacts'),
  getThread:   (userId, params) => api.get(`/messages/thread/${userId}`, { params }),
}

// ─── Audit ─────────────────────────────────────────────────────────────────
export const auditApi = {
  list: (params) => api.get('/audit', { params }),
}

export default api
