import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'
import {
  LayoutDashboard, Users, Clock, Calendar, MessageSquare,
  MapPin, FileText, Settings, LogOut, Bell, ChevronRight
} from 'lucide-react'

const hrNav = [
  { to: '/hr/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/hr/employees',   icon: Users,            label: 'Employees' },
  { to: '/hr/attendance',  icon: Clock,            label: 'Attendance' },
  { to: '/hr/locations',   icon: MapPin,           label: 'Locations' },
  { to: '/hr/leaves',      icon: Calendar,         label: 'Leaves',     badge: 2 },
  { to: '/hr/messages',    icon: MessageSquare,    label: 'Messages',   badge: 3 },
  { to: '/hr/audit',       icon: FileText,         label: 'Audit Log' },
]

const employeeNav = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/attendance', icon: Clock,            label: 'My Attendance' },
  { to: '/leaves',     icon: Calendar,         label: 'My Leaves' },
  { to: '/messages',   icon: MessageSquare,    label: 'Messages',  badge: 1 },
]

export default function Sidebar() {
  const { user, logout, isHR } = useAuth()
  const navigate = useNavigate()
  const nav = isHR ? hrNav : employeeNav

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-mark">AT</div>
        <div>
          <div className="logo-text">AttendTrack</div>
          <div className="logo-sub">{isHR ? 'HR Portal' : 'Employee'}</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Main Menu</div>
        {nav.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="nav-icon" size={18} />
            {label}
            {badge && <span className="nav-badge">{badge}</span>}
          </NavLink>
        ))}

        <div className="nav-section-label" style={{ marginTop: 8 }}>Account</div>
        <NavLink
          to={isHR ? '/hr/settings' : '/settings'}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Settings className="nav-icon" size={18} />
          Settings
        </NavLink>
      </nav>

      {/* User card */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div className="avatar">{user?.avatar}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="text-sm font-semibold truncate">{user?.name}</div>
            <div className="text-xs text-muted truncate">{user?.department}</div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-icon btn-ghost"
            title="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  )
}
