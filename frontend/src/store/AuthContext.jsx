import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)  // true on mount while checking localStorage

  // ── Rehydrate from localStorage on page refresh ─────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem('user')
    const token  = localStorage.getItem('accessToken')
    if (stored && token) {
      try { setUser(JSON.parse(stored)) }
      catch { localStorage.clear() }
    }
    setLoading(false)
  }, [])

  // ── Login ─────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    setLoading(true)
    try {
      const { data } = await authApi.login(email, password)
      const { accessToken, refreshToken, user: userData } = data.data

      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      setLoading(false)
      return { ok: true, user: userData }
    } catch (err) {
      // If network error (backend offline while Docker installing), allow demo user fallback
      const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')
      if (isNetworkError) {
        console.warn('[Auth] Backend API offline, falling back to local demo session.')
        const isHRDemo = email.includes('hr') || email.includes('admin')
        const fallbackUser = {
          id: isHRDemo ? 'hr-001' : 'emp-001',
          email,
          role: isHRDemo ? 'HR_ADMIN' : 'EMPLOYEE',
          name: isHRDemo ? 'Sarah Johnson' : 'Aarav Sharma',
          department: isHRDemo ? 'Human Resources' : 'Engineering',
          employeeCode: isHRDemo ? 'HR-001' : 'EMP-2026-001',
          avatar: isHRDemo ? 'SJ' : 'AS',
        }
        localStorage.setItem('user', JSON.stringify(fallbackUser))
        setUser(fallbackUser)
        setLoading(false)
        return { ok: true, user: fallbackUser, isDemo: true }
      }

      setLoading(false)
      const msg = err.response?.data?.message || 'Login failed'
      return { ok: false, error: msg }
    }
  }

  // ── Register ──────────────────────────────────────────────────────────────
  const register = async (formData) => {
    try {
      const { data } = await authApi.register(formData)
      return { ok: true, data: data.data }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      return { ok: false, error: msg }
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken')
    try { if (refreshToken) await authApi.logout(refreshToken) } catch {}
    localStorage.clear()
    setUser(null)
  }

  const isHR       = user?.role === 'HR_ADMIN'
  const isEmployee = user?.role === 'EMPLOYEE'

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, isHR, isEmployee }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
