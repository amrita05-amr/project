import { useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Topbar from '../../components/Topbar'
import { StatusBadge, formatDate } from '../../lib/utils'
import { Calendar, CheckCircle, XCircle, Clock, CheckCircle2, User, Filter } from 'lucide-react'

const initialLeaves = [
  { id: 'l1', employeeName: 'Sneha Patel', department: 'Engineering', type: 'Sick Leave', startDate: '2026-09-04', endDate: '2026-09-05', days: 2, reason: 'Viral fever and doctor advice for rest', status: 'PENDING', appliedAt: 'Today, 9:30 AM' },
  { id: 'l2', employeeName: 'Rohan Gupta', department: 'Marketing', type: 'Casual Leave', startDate: '2026-09-08', endDate: '2026-09-09', days: 2, reason: 'Family gathering in home town', status: 'PENDING', appliedAt: 'Yesterday' },
  { id: 'l3', employeeName: 'Fatima Khan', department: 'Design', type: 'Annual Leave', startDate: '2026-09-15', endDate: '2026-09-18', days: 4, reason: 'Pre-planned family vacation', status: 'APPROVED', appliedAt: 'Aug 29, 2026' },
  { id: 'l4', employeeName: 'Arjun Reddy', department: 'Finance', type: 'Casual Leave', startDate: '2026-08-25', endDate: '2026-08-25', days: 1, reason: 'Urgent personal bank work', status: 'REJECTED', appliedAt: 'Aug 24, 2026' },
]

export default function HRLeavesPage() {
  const [leaves, setLeaves] = useState(initialLeaves)
  const [filter, setFilter] = useState('ALL')
  const [actionNotice, setActionNotice] = useState(null)

  const handleDecision = (id, decision) => {
    const updatedStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'
    setLeaves(leaves.map(l => l.id === id ? { ...l, status: updatedStatus } : l))
    const item = leaves.find(l => l.id === id)
    setActionNotice(`${item?.employeeName}'s ${item?.type} request has been ${updatedStatus.toLowerCase()}!`)
    setTimeout(() => setActionNotice(null), 3500)
  }

  const pendingLeaves = leaves.filter(l => l.status === 'PENDING')
  const filteredLeaves = leaves.filter(l => filter === 'ALL' || l.status === filter)

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar title="Leave Management" subtitle="Review employee time-off requests, PTO balances, and approvals" />
        <div className="page-content">

          {actionNotice && (
            <div className="animate-fade-in mb-4" style={{ padding: '12px 16px', background: 'var(--color-success-bg)', border: '1px solid var(--color-success-ring)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={16} color="var(--color-success)" />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-success)' }}>{actionNotice}</span>
            </div>
          )}

          {/* Pending Requests Cards */}
          {pendingLeaves.length > 0 && (
            <div className="mb-6">
              <div className="font-semibold text-sm mb-3 flex items-center gap-2">
                <span>Pending Leave Applications</span>
                <span className="badge badge-pending">{pendingLeaves.length} Action Needed</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {pendingLeaves.map(leave => (
                  <div key={leave.id} className="card animate-fade-in-up" style={{ padding: 18, border: '1px solid var(--indigo-200)', background: 'var(--bg-surface)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div>
                        <div className="font-semibold text-sm">{leave.employeeName}</div>
                        <div className="text-xs text-muted">{leave.department} · Applied {leave.appliedAt}</div>
                      </div>
                      <span className="badge badge-primary">{leave.type}</span>
                    </div>

                    <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 12 }}>
                      <div className="text-xs font-medium mb-1 flex items-center gap-1.5 text-muted">
                        <Calendar size={13} /> {formatDate(leave.startDate)} to {formatDate(leave.endDate)} ({leave.days} {leave.days === 1 ? 'day' : 'days'})
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>"{leave.reason}"</div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => handleDecision(leave.id, 'APPROVE')}
                        className="btn btn-sm flex-1 flex items-center justify-center gap-1.5"
                        style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: '1px solid var(--color-success-ring)', fontWeight: 600 }}
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleDecision(leave.id, 'REJECT')}
                        className="btn btn-sm flex-1 flex items-center justify-center gap-1.5"
                        style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger-ring)', fontWeight: 600 }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leave History Table */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="font-semibold text-sm">All Leave Records</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={`btn btn-sm ${filter === tab ? 'btn-primary' : 'btn-ghost'}`}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {tab.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaves.map(l => (
                    <tr key={l.id} className="animate-fade-in">
                      <td>
                        <div className="font-medium text-sm">{l.employeeName}</div>
                        <div className="text-xs text-muted">{l.department}</div>
                      </td>
                      <td><span className="text-sm font-medium">{l.type}</span></td>
                      <td><span className="text-xs text-muted">{formatDate(l.startDate)} - {formatDate(l.endDate)}</span></td>
                      <td><span className="text-sm font-semibold">{l.days} {l.days === 1 ? 'day' : 'days'}</span></td>
                      <td><span className="text-xs text-muted truncate" style={{ maxWidth: 220, display: 'inline-block' }}>{l.reason}</span></td>
                      <td>
                        <span className={`badge ${l.status === 'APPROVED' ? 'badge-success' : l.status === 'REJECTED' ? 'badge-danger' : 'badge-pending'}`}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
