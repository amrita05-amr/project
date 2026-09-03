import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './store/AuthContext'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import EmployeeDashboard from './pages/employee/EmployeeDashboard'
import EmployeeAttendancePage from './pages/employee/EmployeeAttendancePage'
import EmployeeLeavesPage from './pages/employee/EmployeeLeavesPage'
import EmployeeMessagesPage from './pages/employee/EmployeeMessagesPage'
import HRDashboard from './pages/hr/HRDashboard'
import HREmployeesPage from './pages/hr/HREmployeesPage'
import HRAttendancePage from './pages/hr/HRAttendancePage'
import HRLocationsPage from './pages/hr/HRLocationsPage'
import HRLeavesPage from './pages/hr/HRLeavesPage'
import HRMessagesPage from './pages/hr/HRMessagesPage'
import HRAuditPage from './pages/hr/HRAuditPage'
import SettingsPage from './pages/hr/SettingsPage'

function ProtectedRoute({ children, requiredRole }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'HR_ADMIN' ? '/hr/dashboard' : '/dashboard'} replace />
  }
  return children
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'HR_ADMIN' ? '/hr/dashboard' : '/dashboard'} /> : <LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Employee routes */}
      <Route path="/dashboard" element={<ProtectedRoute requiredRole="EMPLOYEE"><EmployeeDashboard /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute requiredRole="EMPLOYEE"><EmployeeAttendancePage /></ProtectedRoute>} />
      <Route path="/leaves" element={<ProtectedRoute requiredRole="EMPLOYEE"><EmployeeLeavesPage /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute requiredRole="EMPLOYEE"><EmployeeMessagesPage /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute requiredRole="EMPLOYEE"><SettingsPage /></ProtectedRoute>} />

      {/* HR routes */}
      <Route path="/hr/dashboard" element={<ProtectedRoute requiredRole="HR_ADMIN"><HRDashboard /></ProtectedRoute>} />
      <Route path="/hr/employees" element={<ProtectedRoute requiredRole="HR_ADMIN"><HREmployeesPage /></ProtectedRoute>} />
      <Route path="/hr/attendance" element={<ProtectedRoute requiredRole="HR_ADMIN"><HRAttendancePage /></ProtectedRoute>} />
      <Route path="/hr/locations" element={<ProtectedRoute requiredRole="HR_ADMIN"><HRLocationsPage /></ProtectedRoute>} />
      <Route path="/hr/leaves" element={<ProtectedRoute requiredRole="HR_ADMIN"><HRLeavesPage /></ProtectedRoute>} />
      <Route path="/hr/messages" element={<ProtectedRoute requiredRole="HR_ADMIN"><HRMessagesPage /></ProtectedRoute>} />
      <Route path="/hr/audit" element={<ProtectedRoute requiredRole="HR_ADMIN"><HRAuditPage /></ProtectedRoute>} />
      <Route path="/hr/settings" element={<ProtectedRoute requiredRole="HR_ADMIN"><SettingsPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
