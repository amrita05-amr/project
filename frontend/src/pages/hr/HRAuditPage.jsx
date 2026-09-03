import { useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Topbar from '../../components/Topbar'
import { FileText, Shield, Search, Filter, Download, ArrowRight, CheckCircle2 } from 'lucide-react'

const mockAudit = [
  { id: 'aud-1', actor: 'Sarah Johnson (HR)', action: 'APPROVE_REGISTRATION', entityType: 'Employee', entityId: 'emp-2026-008', timestamp: '2026-09-03 10:45 AM', details: 'Approved onboarding for Rahul Desai' },
  { id: 'aud-2', actor: 'Aarav Sharma', action: 'CHECK_IN', entityType: 'AttendanceSession', entityId: 'sess-8812', timestamp: '2026-09-03 09:02 AM', details: 'GPS verified: Lat 19.0760, Lng 72.8777 (Inside geofence)' },
  { id: 'aud-3', actor: 'Priya Nair', action: 'DUTY_TOGGLE', entityType: 'AttendanceSession', entityId: 'sess-8813', timestamp: '2026-09-03 09:15 AM', details: 'Duty state changed: OFF -> ON' },
  { id: 'aud-4', actor: 'Sarah Johnson (HR)', action: 'LEAVE_APPROVE', entityType: 'LeaveRequest', entityId: 'leave-042', timestamp: '2026-09-02 04:30 PM', details: 'Approved 4 days annual leave for Fatima Khan' },
  { id: 'aud-5', actor: 'System Auto-Close', action: 'SESSION_AUTO_CLOSE', entityType: 'AttendanceSession', entityId: 'sess-8790', timestamp: '2026-09-02 11:59 PM', details: 'Auto-closed unpunched shift after 23:59 rule' },
  { id: 'aud-6', actor: 'Karan Mehta', action: 'CHECK_OUT', entityType: 'AttendanceSession', entityId: 'sess-8789', timestamp: '2026-09-02 06:12 PM', details: 'Normal check-out logged (9.2h)' },
]

export default function HRAuditPage() {
  const [logs, setLogs] = useState(mockAudit)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('ALL')

  const handleExport = () => {
    const headers = ['ID', 'Actor', 'Action', 'Entity', 'Timestamp', 'Details']
    const rows = filtered.map(l => [`"${l.id}"`, `"${l.actor}"`, `"${l.action}"`, `"${l.entityType}"`, `"${l.timestamp}"`, `"${l.details}"`])
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `Security_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filtered = logs.filter(l => {
    const matchesSearch = l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase())
    const matchesAction = actionFilter === 'ALL' || l.action === actionFilter
    return matchesSearch && matchesAction
  })

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar title="Security & Audit Trail" subtitle="Tamper-evident logs of check-ins, approvals, and location events" />
        <div className="page-content">

          {/* Action bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="input-icon" style={{ width: 280 }}>
                <Search size={15} className="icon-left" />
                <input
                  className="input"
                  placeholder="Search logs by actor, action or event..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 36, fontSize: '0.8125rem' }}
                />
              </div>

              <select
                className="input"
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                style={{ fontSize: '0.8125rem', width: 170 }}
              >
                <option value="ALL">All Actions</option>
                <option value="CHECK_IN">Check In</option>
                <option value="CHECK_OUT">Check Out</option>
                <option value="APPROVE_REGISTRATION">Approve Registration</option>
                <option value="LEAVE_APPROVE">Leave Decision</option>
                <option value="SESSION_AUTO_CLOSE">System Auto Close</option>
              </select>
            </div>

            <button className="btn btn-secondary flex items-center gap-2" onClick={handleExport}>
              <Download size={15} /> Export Audit Log
            </button>
          </div>

          {/* Audit Logs Table */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity Type</th>
                    <th>Audit Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.id} className="animate-fade-in">
                      <td><span className="text-xs font-mono text-muted">{item.timestamp}</span></td>
                      <td>
                        <span className="text-sm font-semibold flex items-center gap-1.5">
                          <Shield size={13} color="var(--color-primary)" /> {item.actor}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                          {item.action}
                        </span>
                      </td>
                      <td><span className="text-xs font-medium text-muted">{item.entityType}</span></td>
                      <td><span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.details}</span></td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No audit events match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
