import { useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Topbar from '../../components/Topbar'
import { StatusBadge, formatHours, formatDate } from '../../lib/utils'
import { mockAttendanceHistory } from '../../lib/mockData'
import { Calendar, Download, Clock, CheckCircle, TrendingUp, AlertCircle } from 'lucide-react'

export default function EmployeeAttendancePage() {
  const [history, setHistory] = useState(mockAttendanceHistory)
  const [selectedMonth, setSelectedMonth] = useState('September 2026')

  const totalHoursWorked = history.reduce((sum, h) => sum + (h.hours || 0), 0)
  const presentDays = history.filter(h => h.status === 'WORKING' || h.status === 'CHECKED_OUT').length
  const avgDailyHours = presentDays > 0 ? (totalHoursWorked / presentDays).toFixed(1) : '0.0'

  const handleExportCSV = () => {
    const headers = ['Date', 'Check In', 'Check Out', 'Hours Worked', 'Status']
    const rows = history.map(h => [
      `"${h.date}"`,
      `"${h.checkIn || 'N/A'}"`,
      `"${h.checkOut || 'N/A'}"`,
      h.hours || 0,
      `"${h.status}"`
    ])
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const uri = encodeURI(csv)
    const link = document.createElement('a')
    link.setAttribute('href', uri)
    link.setAttribute('download', `My_Attendance_Statement_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar title="My Attendance Records" subtitle="Review your daily punches, timesheets, and monthly metrics" />
        <div className="page-content">

          {/* Top summary cards */}
          <div className="stats-grid mb-6">
            <div className="stat-card card-indigo animate-fade-in-up stagger-1">
              <div className="stat-card-icon" style={{ background: '#EEF2FF' }}>
                <Clock size={20} color="#4F46E5" />
              </div>
              <div className="stat-card-value" style={{ color: '#4F46E5' }}>{totalHoursWorked.toFixed(1)}h</div>
              <div className="stat-card-label">Total Hours This Month</div>
            </div>

            <div className="stat-card card-green animate-fade-in-up stagger-2">
              <div className="stat-card-icon" style={{ background: '#ECFDF5' }}>
                <CheckCircle size={20} color="#059669" />
              </div>
              <div className="stat-card-value" style={{ color: '#059669' }}>{presentDays} / 22</div>
              <div className="stat-card-label">Days Present</div>
            </div>

            <div className="stat-card card-amber animate-fade-in-up stagger-3">
              <div className="stat-card-icon" style={{ background: '#FFFBEB' }}>
                <TrendingUp size={20} color="#D97706" />
              </div>
              <div className="stat-card-value" style={{ color: '#D97706' }}>{avgDailyHours}h</div>
              <div className="stat-card-label">Average Shift Duration</div>
            </div>
          </div>

          {/* Action bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={16} color="var(--text-muted)" />
              <select
                className="input"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                style={{ fontSize: '0.8125rem' }}
              >
                <option value="September 2026">September 2026</option>
                <option value="August 2026">August 2026</option>
                <option value="July 2026">July 2026</option>
              </select>
            </div>

            <button className="btn btn-secondary flex items-center gap-2" onClick={handleExportCSV}>
              <Download size={15} /> Download Statement (CSV)
            </button>
          </div>

          {/* Attendance History Table */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours Worked</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => {
                    const d = new Date(h.date)
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
                    return (
                      <tr key={h.date} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                        <td><span className="text-sm font-medium">{formatDate(h.date)}</span></td>
                        <td><span className="text-xs text-muted">{dayName}</span></td>
                        <td><span className="text-sm">{h.checkIn || '—'}</span></td>
                        <td><span className="text-sm">{h.checkOut || (h.status === 'WORKING' ? <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Active</span> : '—')}</span></td>
                        <td>
                          <span className="font-semibold text-sm" style={{ color: h.hours > 0 ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                            {formatHours(h.hours)}
                          </span>
                        </td>
                        <td><StatusBadge status={h.status} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
