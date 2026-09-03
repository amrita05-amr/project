import { useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Topbar from '../../components/Topbar'
import { StatusBadge, formatHours, formatDate } from '../../lib/utils'
import { mockEmployees } from '../../lib/mockData'
import {
  Clock, Download, Calendar, Filter, CheckCircle2, AlertTriangle, UserCheck, Edit3, X
} from 'lucide-react'

export default function HRAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [records, setRecords] = useState(mockEmployees)
  const [editingRecord, setEditingRecord] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Employee Name', 'Department', 'Role', 'Status', 'Check In', 'Check Out', 'Hours']
    const rows = records.map(r => [
      `"${r.name}"`,
      `"${r.department}"`,
      `"${r.role}"`,
      `"${r.status}"`,
      `"${r.checkIn || 'N/A'}"`,
      `"${r.checkOut || 'N/A'}"`,
      r.hours || 0
    ])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Attendance_Report_${selectedDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSaveAdjustment = (e) => {
    e.preventDefault()
    if (!editingRecord) return
    setRecords(records.map(r => r.id === editingRecord.id ? editingRecord : r))
    setShowEditModal(false)
  }

  const filtered = records.filter(r => {
    if (statusFilter === 'ALL') return true
    return r.status === statusFilter
  })

  const workingCount = records.filter(r => r.status === 'WORKING' || r.status === 'CHECKED_OUT').length
  const absentCount = records.filter(r => r.status === 'ABSENT').length
  const leaveCount = records.filter(r => r.status === 'ON_LEAVE').length

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar title="Company Attendance Logs" subtitle="Daily employee roll call, punch records, and timesheets" />
        <div className="page-content">

          {/* Quick Metrics */}
          <div className="stats-grid mb-6">
            <div className="stat-card card-green animate-fade-in-up stagger-1">
              <div className="stat-card-icon" style={{ background: '#ECFDF5' }}>
                <UserCheck size={20} color="#059669" />
              </div>
              <div className="stat-card-value" style={{ color: '#059669' }}>{workingCount}</div>
              <div className="stat-card-label">Present Today</div>
            </div>
            <div className="stat-card card-red animate-fade-in-up stagger-2">
              <div className="stat-card-icon" style={{ background: '#FEF2F2' }}>
                <AlertTriangle size={20} color="#DC2626" />
              </div>
              <div className="stat-card-value" style={{ color: '#DC2626' }}>{absentCount}</div>
              <div className="stat-card-label">Unexcused Absences</div>
            </div>
            <div className="stat-card card-amber animate-fade-in-up stagger-3">
              <div className="stat-card-icon" style={{ background: '#FFFBEB' }}>
                <Calendar size={20} color="#D97706" />
              </div>
              <div className="stat-card-value" style={{ color: '#D97706' }}>{leaveCount}</div>
              <div className="stat-card-label">On Approved Leave</div>
            </div>
            <div className="stat-card card-indigo animate-fade-in-up stagger-4">
              <div className="stat-card-icon" style={{ background: '#EEF2FF' }}>
                <Clock size={20} color="#4F46E5" />
              </div>
              <div className="stat-card-value" style={{ color: '#4F46E5' }}>6.8h</div>
              <div className="stat-card-label">Avg Daily Hours</div>
            </div>
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface)', padding: '6px 12px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)' }}>
                <Calendar size={15} color="var(--text-muted)" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  style={{ border: 'none', background: 'transparent', fontSize: '0.8125rem', outline: 'none' }}
                />
              </div>

              <select
                className="input"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ fontSize: '0.8125rem', width: 140 }}
              >
                <option value="ALL">All Statuses</option>
                <option value="WORKING">Working</option>
                <option value="CHECKED_OUT">Checked Out</option>
                <option value="ON_BREAK">On Break</option>
                <option value="ABSENT">Absent</option>
                <option value="ON_LEAVE">On Leave</option>
              </select>
            </div>

            <button className="btn btn-secondary flex items-center gap-2" onClick={handleExportCSV}>
              <Download size={15} /> Export CSV Report
            </button>
          </div>

          {/* Attendance Table */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Hours</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(emp => (
                    <tr key={emp.id} className="animate-fade-in">
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
                      <td><span className="text-sm font-medium">{formatDate(selectedDate)}</span></td>
                      <td><span className="text-sm">{emp.checkIn || '—'}</span></td>
                      <td><span className="text-sm">{emp.checkOut || (emp.status === 'WORKING' ? <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Active</span> : '—')}</span></td>
                      <td>
                        <span className="font-semibold text-sm" style={{ color: emp.hours > 0 ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                          {formatHours(emp.hours)}
                        </span>
                      </td>
                      <td><StatusBadge status={emp.status} /></td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-icon-sm btn-ghost"
                          title="Manual Attendance Adjustment"
                          onClick={() => {
                            setEditingRecord({ ...emp })
                            setShowEditModal(true)
                          }}
                        >
                          <Edit3 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Manual Override Modal */}
      {showEditModal && editingRecord && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="font-semibold text-base">Adjust Attendance Record</span>
              <button className="btn btn-icon-sm btn-ghost" onClick={() => setShowEditModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSaveAdjustment}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
                  <div className="text-sm font-semibold">{editingRecord.name}</div>
                  <div className="text-xs text-muted">{editingRecord.department} · {editingRecord.role}</div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Status</label>
                  <select
                    className="input w-full"
                    value={editingRecord.status}
                    onChange={e => setEditingRecord({ ...editingRecord, status: e.target.value })}
                  >
                    <option value="WORKING">Working (Active)</option>
                    <option value="CHECKED_OUT">Checked Out</option>
                    <option value="ON_BREAK">On Break</option>
                    <option value="ABSENT">Absent</option>
                    <option value="ON_LEAVE">On Leave</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1">Check In Time</label>
                    <input
                      type="text"
                      className="input w-full"
                      value={editingRecord.checkIn || ''}
                      placeholder="09:00 AM"
                      onChange={e => setEditingRecord({ ...editingRecord, checkIn: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1">Check Out Time</label>
                    <input
                      type="text"
                      className="input w-full"
                      value={editingRecord.checkOut || ''}
                      placeholder="05:30 PM"
                      onChange={e => setEditingRecord({ ...editingRecord, checkOut: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Total Hours</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input w-full"
                    value={editingRecord.hours || 0}
                    onChange={e => setEditingRecord({ ...editingRecord, hours: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
