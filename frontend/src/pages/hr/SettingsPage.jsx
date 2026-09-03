import { useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Topbar from '../../components/Topbar'
import { useAuth } from '../../store/AuthContext'
import { User, Bell, Shield, Save, CheckCircle2, Lock } from 'lucide-react'

export default function SettingsPage() {
  const { user, isHR } = useAuth()
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || 'Operations',
    emailNotifs: true,
    attendanceAlerts: true,
    soundAlerts: false,
    autoCloseReminder: true,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar title="Account & System Settings" subtitle="Manage your profile, preferences and security" />
        <div className="page-content" style={{ maxWidth: 880 }}>
          {saved && (
            <div className="animate-fade-in mb-4" style={{ padding: '12px 16px', background: 'var(--color-success-bg)', border: '1px solid var(--color-success-ring)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={18} color="var(--color-success)" />
              <span className="text-sm font-semibold" style={{ color: 'var(--color-success)' }}>Settings saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Profile Card */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div className="avatar avatar-lg">{user?.avatar || user?.name?.slice(0, 2).toUpperCase() || 'U'}</div>
                <div>
                  <div className="font-semibold text-base">{user?.name}</div>
                  <div className="text-xs text-muted">{isHR ? 'HR Administrator' : 'Employee'} · {user?.department || 'Operations'}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="input w-full"
                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                  />
                </div>
              </div>
            </div>

            {/* Notification Preferences */}
            <div className="card">
              <div className="font-semibold text-sm mb-1 flex items-center gap-2">
                <Bell size={16} color="var(--color-primary)" /> Notification Preferences
              </div>
              <div className="text-xs text-muted mb-4">Choose how you want to be alerted about attendance and messages.</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <div className="text-sm font-medium">Email Notifications</div>
                    <div className="text-xs text-muted">Receive daily attendance summary and shift updates</div>
                  </div>
                  <input
                    type="checkbox"
                    name="emailNotifs"
                    checked={formData.emailNotifs}
                    onChange={handleChange}
                    style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
                  />
                </label>

                <div className="divider" style={{ margin: 0 }} />

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <div className="text-sm font-medium">Attendance & Heartbeat Alerts</div>
                    <div className="text-xs text-muted">Instant alert when check-in or checkout is missed</div>
                  </div>
                  <input
                    type="checkbox"
                    name="attendanceAlerts"
                    checked={formData.attendanceAlerts}
                    onChange={handleChange}
                    style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
                  />
                </label>

                <div className="divider" style={{ margin: 0 }} />

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <div>
                    <div className="text-sm font-medium">Sound Notifications</div>
                    <div className="text-xs text-muted">Play alert chime when a new message arrives</div>
                  </div>
                  <input
                    type="checkbox"
                    name="soundAlerts"
                    checked={formData.soundAlerts}
                    onChange={handleChange}
                    style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }}
                  />
                </label>
              </div>
            </div>

            {/* Security */}
            <div className="card">
              <div className="font-semibold text-sm mb-1 flex items-center gap-2">
                <Shield size={16} color="var(--color-primary)" /> Security & Password
              </div>
              <div className="text-xs text-muted mb-4">Ensure your account uses a strong, secure password.</div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="submit" className="btn btn-primary flex items-center gap-2">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
