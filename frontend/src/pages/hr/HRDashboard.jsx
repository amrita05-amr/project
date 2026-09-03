import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import Topbar from '../../components/Topbar'
import EmployeeModal from '../../components/EmployeeModal'
import { StatusBadge, formatHours, formatDate } from '../../lib/utils'
import { hrApi, employeesApi, locationApi } from '../../lib/api'
import { mockDashboardStats, mockEmployees, mockPendingApprovals, mockAttendanceHistory } from '../../lib/mockData'
import {
  Users, UserCheck, UserX, Clock, MapPin, CheckCircle, XCircle,
  TrendingUp, TrendingDown, AlertCircle, Eye, RefreshCw
} from 'lucide-react'

function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const end = parseInt(value) || 0
    if (start === end) return
    const step = Math.ceil(end / (duration / 16)) || 1
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setDisplay(end); clearInterval(timer) }
      else setDisplay(start)
    }, 16)
    return () => clearInterval(timer)
  }, [value])
  return <>{display}</>
}

const stats = [
  { key: 'total',    label: 'Total Employees', icon: Users,     cardCls: 'card-indigo', iconBg: '#EEF2FF', iconColor: '#4F46E5', trend: '+2 this month', up: true },
  { key: 'present',  label: 'Present Today',   icon: UserCheck, cardCls: 'card-green',  iconBg: '#ECFDF5', iconColor: '#059669', trend: '64% of team', up: true },
  { key: 'absent',   label: 'Absent Today',    icon: UserX,     cardCls: 'card-red',    iconBg: '#FEF2F2', iconColor: '#DC2626', trend: 'vs 8 yesterday', up: false },
  { key: 'onLeave',  label: 'On Leave',        icon: Clock,     cardCls: 'card-amber',  iconBg: '#FFFBEB', iconColor: '#D97706', trend: '2 returning tomorrow', up: null },
]

export default function HRDashboard() {
  const [activeTab, setActiveTab] = useState('all')
  const [data, setData] = useState(mockDashboardStats)
  const [employees, setEmployees] = useState(mockEmployees)
  const [pending, setPending] = useState(mockPendingApprovals)
  const [staleAlerts, setStaleAlerts] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedEmp, setSelectedEmp] = useState(null)

  const loadData = async () => {
    setIsRefreshing(true)
    try {
      const [dashRes, empRes, locRes] = await Promise.allSettled([
        hrApi.getDashboard(),
        employeesApi.list({ status: 'PENDING' }),
        locationApi.getLatest()
      ])

      if (dashRes.status === 'fulfilled' && dashRes.value.data?.data) {
        setData(dashRes.value.data.data)
      }
      if (empRes.status === 'fulfilled' && empRes.value.data?.data) {
        const pendingList = empRes.value.data.data
        if (Array.isArray(pendingList) && pendingList.length > 0) {
          setPending(pendingList.map(p => ({
            id: p.id,
            name: p.fullName,
            email: p.user?.email || '',
            department: p.department,
            code: p.employeeCode,
            submittedAt: new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          })))
        }
      }
      if (locRes.status === 'fulfilled' && locRes.value.data?.data?.locations) {
        const stale = locRes.value.data.data.locations.filter(l => l.isStale)
        setStaleAlerts(stale)
      }
    } catch (e) {
      // Fallback stays in place
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // 30-sec live poll
    return () => clearInterval(interval)
  }, [])

  const handleDecision = async (id, decision) => {
    // Optimistic UI update
    setPending(prev => prev.filter(p => p.id !== id))
    setData(prev => ({ ...prev, pendingApprovals: Math.max(0, (prev.pendingApprovals || 1) - 1) }))
    try {
      await employeesApi.approve(id, decision)
    } catch (e) {
      console.warn('[HR] Decision API call failed, kept optimistic state')
    }
  }

  const filtered = activeTab === 'all' ? employees
    : employees.filter(e => e.status === activeTab.toUpperCase())

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar title="HR Dashboard" subtitle={`${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`} />
        <div className="page-content">

          {/* Stats Grid */}
          <div className="stats-grid">
            {stats.map(({ key, label, icon: Icon, cardCls, iconBg, iconColor, trend, up }, i) => (
              <div key={key} className={`stat-card ${cardCls} animate-fade-in-up stagger-${i + 1}`}>
                <div className="stat-card-icon" style={{ background: iconBg }}>
                  <Icon size={20} color={iconColor} />
                </div>
                <div className="stat-card-value" style={{ color: iconColor }}>
                  <AnimatedNumber value={data[key]} />
                </div>
                <div className="stat-card-label">{label}</div>
                {trend && (
                  <div className="stat-card-change" style={{ color: up === true ? 'var(--color-success)' : up === false ? 'var(--color-danger)' : 'var(--text-muted)' }}>
                    {up === true ? <TrendingUp size={11} /> : up === false ? <TrendingDown size={11} /> : null}
                    {trend}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="content-grid">
            {/* Main: Employee Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Filter tabs */}
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div className="font-semibold" style={{ fontSize: '0.9375rem' }}>Employee Attendance</div>
                    <div className="text-xs text-muted">Live status — updates every 30 seconds</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[['all','All'], ['working','Working'], ['absent','Absent'], ['on_leave','On Leave']].map(([v, l]) => (
                      <button key={v} onClick={() => setActiveTab(v)}
                        className={`btn btn-sm ${activeTab === v ? 'btn-primary' : 'btn-ghost'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Department</th>
                        <th>Check In</th>
                        <th>Hours Today</th>
                        <th>Status</th>
                        <th>Location</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((emp, i) => (
                        <tr key={emp.id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div className="avatar avatar-sm">{emp.avatar}</div>
                              <div>
                                <div className="font-medium text-sm">{emp.name}</div>
                                <div className="text-xs text-muted">{emp.role}</div>
                              </div>
                            </div>
                          </td>
                          <td><span className="text-sm">{emp.department}</span></td>
                          <td><span className="text-sm">{emp.checkIn || '—'}</span></td>
                          <td>
                            <span className="font-semibold text-sm" style={{ color: emp.hours > 0 ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                              {formatHours(emp.hours)}
                            </span>
                          </td>
                          <td><StatusBadge status={emp.status} /></td>
                          <td>
                            {emp.location ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <MapPin size={12} color="var(--text-muted)" />
                                <span className="text-xs text-muted">{emp.location}</span>
                              </div>
                            ) : <span className="text-xs text-muted">—</span>}
                          </td>
                          <td>
                            <button
                              className="btn btn-icon-sm btn-ghost"
                              title="View Employee Profile"
                              onClick={() => setSelectedEmp(emp)}
                            >
                              <Eye size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Pending Approvals */}
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="font-semibold" style={{ fontSize: '0.9375rem' }}>Pending Approvals</div>
                  <span className="badge badge-pending">{pending.length}</span>
                </div>
                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {pending.map(p => (
                    <div key={p.id} style={{ padding: '12px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-elevated)', border: '1px solid var(--border-base)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, #7C3AED, #5B21B6)' }}>{p.name.split(' ').map(w=>w[0]).join('')}</div>
                          <div>
                            <div className="text-sm font-semibold">{p.name}</div>
                            <div className="text-xs text-muted">{p.department} · {p.code}</div>
                            <div className="text-xs text-muted" style={{ marginTop: 2 }}>{p.submittedAt}</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => handleDecision(p.id, 'APPROVE')}
                            title="Approve Employee"
                            className="btn btn-icon-sm"
                            style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success-ring)' }}
                          >
                            <CheckCircle size={13} />
                          </button>
                          <button
                            onClick={() => handleDecision(p.id, 'REJECT')}
                            title="Reject Request"
                            className="btn btn-icon-sm"
                            style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger-ring)' }}
                          >
                            <XCircle size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="card">
                <div className="font-semibold text-sm mb-4">Today at a Glance</div>
                {[
                  { label: 'Working', value: data.working,  color: 'var(--color-success)' },
                  { label: 'On Break', value: data.onBreak, color: 'var(--color-warning)' },
                  { label: 'Checked Out', value: data.present - data.working - data.onBreak, color: 'var(--text-muted)' },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="text-xs font-medium">{item.label}</span>
                      <span className="text-xs font-bold" style={{ color: item.color }}>{item.value}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${(item.value / data.total) * 100}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Alert banner */}
              <div style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-ring)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', display: 'flex', gap: 10 }}>
                <AlertCircle size={18} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-warning)' }}>
                    {staleAlerts.length > 0 ? `${staleAlerts.length} stale locations` : 'Location Heartbeat Monitor'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    {staleAlerts.length > 0
                      ? `${staleAlerts.map(s => s.employeeName).join(', ')} — no heartbeat in 45+ min`
                      : 'All active on-duty employee location signals are up to date.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {selectedEmp && (
        <EmployeeModal employee={selectedEmp} onClose={() => setSelectedEmp(null)} />
      )}
    </div>
  )
}
