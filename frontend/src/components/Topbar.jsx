import { useState, useRef, useEffect } from 'react'
import { Bell, Search, CheckCircle, Clock, AlertTriangle, MessageSquare, X } from 'lucide-react'
import { useAuth } from '../store/AuthContext'

export default function Topbar({ title, subtitle, onSearch }) {
  const { user } = useAuth()
  const [showNotifs, setShowNotifs] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [notifs, setNotifs] = useState([
    { id: 1, title: 'Check-in Recorded', desc: 'Daily attendance successfully logged', time: '10 mins ago', icon: Clock, read: false },
    { id: 2, title: 'New Leave Request', desc: 'Sneha Patel applied for Sick Leave', time: '1 hr ago', icon: AlertTriangle, read: false },
    { id: 3, title: 'HR Announcement', desc: 'Monthly review meeting scheduled for Friday', time: '3 hrs ago', icon: MessageSquare, read: true },
  ])
  const notifRef = useRef(null)

  const unreadCount = notifs.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  // Close notifications on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    if (onSearch) onSearch(e.target.value)
  }

  return (
    <header className="topbar">
      <div>
        <div className="font-semibold" style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{title}</div>
        {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="input-icon" style={{ width: 220, position: 'relative' }}>
          <Search size={15} className="icon-left" />
          <input
            className="input"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            style={{ padding: '8px 30px 8px 36px', fontSize: '0.8125rem', borderRadius: 'var(--radius-full)' }}
          />
          {searchTerm && (
            <button
              onClick={() => { setSearchTerm(''); if (onSearch) onSearch('') }}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            className={`btn btn-icon ${showNotifs ? 'btn-primary' : 'btn-secondary'}`}
            style={{ position: 'relative' }}
            onClick={() => setShowNotifs(v => !v)}
            title="Notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && <span className="notif-dot" />}
          </button>

          {showNotifs && (
            <div className="popover-menu" style={{ minWidth: 320 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs font-medium"
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                {notifs.map(n => {
                  const Icon = n.icon
                  return (
                    <div
                      key={n.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border-base)',
                        background: n.read ? 'transparent' : 'var(--bg-elevated)',
                        display: 'flex',
                        gap: 12,
                        cursor: 'pointer'
                      }}
                      onClick={() => setNotifs(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))}
                    >
                      <div className="avatar avatar-sm" style={{ background: 'var(--bg-subtle)', flexShrink: 0 }}>
                        <Icon size={14} color="var(--color-primary)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="text-xs font-semibold flex items-center justify-between">
                          <span>{n.title}</span>
                          <span className="text-muted" style={{ fontSize: '0.65rem' }}>{n.time}</span>
                        </div>
                        <div className="text-xs text-muted truncate" style={{ marginTop: 2 }}>{n.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-2">
          <div className="avatar avatar-sm">{user?.avatar || (user?.name?.slice(0,2).toUpperCase() || 'U')}</div>
          <div>
            <div className="text-sm font-medium" style={{ lineHeight: 1.2 }}>{user?.name}</div>
            <div className="text-xs text-muted">{user?.role === 'HR_ADMIN' ? 'HR Admin' : 'Employee'}</div>
          </div>
        </div>
      </div>
    </header>
  )
}

