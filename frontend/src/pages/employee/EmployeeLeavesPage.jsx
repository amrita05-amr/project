import { useState } from 'react'
import Sidebar from '../../components/Sidebar'
import Topbar from '../../components/Topbar'
import { formatDate } from '../../lib/utils'
import { Calendar, Plus, CheckCircle2, Clock, X, AlertCircle } from 'lucide-react'

const initialMyLeaves = [
  { id: 'ml-1', type: 'Casual Leave', startDate: '2026-09-18', endDate: '2026-09-19', days: 2, reason: 'Personal family event', status: 'PENDING', appliedAt: 'Sep 02, 2026' },
  { id: 'ml-2', type: 'Sick Leave', startDate: '2026-08-10', endDate: '2026-08-11', days: 2, reason: 'High fever', status: 'APPROVED', appliedAt: 'Aug 09, 2026' },
  { id: 'ml-3', type: 'Annual Leave', startDate: '2026-07-01', endDate: '2026-07-04', days: 4, reason: 'Summer trip', status: 'APPROVED', appliedAt: 'Jun 20, 2026' },
]

export default function EmployeeLeavesPage() {
  const [leaves, setLeaves] = useState(initialMyLeaves)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)
  const [newLeave, setNewLeave] = useState({
    type: 'Annual Leave',
    startDate: '',
    endDate: '',
    reason: ''
  })

  const handleApply = (e) => {
    e.preventDefault()
    if (!newLeave.startDate || !newLeave.endDate) return

    const d1 = new Date(newLeave.startDate)
    const d2 = new Date(newLeave.endDate)
    const diffTime = Math.abs(d2 - d1)
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    const created = {
      id: `ml-${Date.now()}`,
      type: newLeave.type,
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      days: days || 1,
      reason: newLeave.reason,
      status: 'PENDING',
      appliedAt: 'Just now'
    }

    setLeaves([created, ...leaves])
    setShowApplyModal(false)
    setSuccessMsg(`Leave request submitted successfully for ${days} days! HR has been notified.`)
    setTimeout(() => setSuccessMsg(null), 4000)
    setNewLeave({ type: 'Annual Leave', startDate: '', endDate: '', reason: '' })
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar title="My Leaves & PTO" subtitle="Track your balance, apply for time off, and view request status" />
        <div className="page-content">

          {successMsg && (
            <div className="animate-fade-in mb-4" style={{ padding: '12px 16px', background: 'var(--color-success-bg)', border: '1px solid var(--color-success-ring)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={16} color="var(--color-success)" />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-success)' }}>{successMsg}</span>
            </div>
          )}

          {/* Balance Cards */}
          <div className="stats-grid mb-6">
            <div className="stat-card card-indigo animate-fade-in-up stagger-1">
              <div className="stat-card-value" style={{ color: '#4F46E5' }}>12 / 16</div>
              <div className="stat-card-label">Annual Leave Days Remaining</div>
              <div className="progress-bar" style={{ marginTop: 10 }}>
                <div className="progress-fill" style={{ width: '75%' }} />
              </div>
            </div>

            <div className="stat-card card-green animate-fade-in-up stagger-2">
              <div className="stat-card-value" style={{ color: '#059669' }}>4 / 6</div>
              <div className="stat-card-label">Casual Leave Days Remaining</div>
              <div className="progress-bar" style={{ marginTop: 10 }}>
                <div className="progress-fill" style={{ width: '66%', background: '#059669' }} />
              </div>
            </div>

            <div className="stat-card card-amber animate-fade-in-up stagger-3">
              <div className="stat-card-value" style={{ color: '#D97706' }}>5 / 6</div>
              <div className="stat-card-label">Sick Leave Days Remaining</div>
              <div className="progress-bar" style={{ marginTop: 10 }}>
                <div className="progress-fill" style={{ width: '83%', background: '#D97706' }} />
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="font-semibold text-sm">My Leave Requests</div>
            <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowApplyModal(true)}>
              <Plus size={16} /> Apply for Leave
            </button>
          </div>

          {/* Leave History Table */}
          <div className="card" style={{ padding: 0 }}>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th>Dates</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Applied On</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(l => (
                    <tr key={l.id} className="animate-fade-in">
                      <td><span className="font-semibold text-sm">{l.type}</span></td>
                      <td><span className="text-xs text-muted">{formatDate(l.startDate)} - {formatDate(l.endDate)}</span></td>
                      <td><span className="text-sm font-semibold">{l.days} {l.days === 1 ? 'day' : 'days'}</span></td>
                      <td><span className="text-xs text-muted truncate" style={{ maxWidth: 220, display: 'inline-block' }}>{l.reason}</span></td>
                      <td><span className="text-xs text-muted">{l.appliedAt}</span></td>
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

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="font-semibold text-base">Submit Leave Application</span>
              <button className="btn btn-icon-sm btn-ghost" onClick={() => setShowApplyModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleApply}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Leave Category *</label>
                  <select
                    className="input w-full"
                    value={newLeave.type}
                    onChange={e => setNewLeave({ ...newLeave, type: e.target.value })}
                  >
                    <option value="Annual Leave">Annual Leave (12 days left)</option>
                    <option value="Casual Leave">Casual Leave (4 days left)</option>
                    <option value="Sick Leave">Sick Leave (5 days left)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1">Start Date *</label>
                    <input
                      type="date"
                      required
                      className="input w-full"
                      value={newLeave.startDate}
                      onChange={e => setNewLeave({ ...newLeave, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1">End Date *</label>
                    <input
                      type="date"
                      required
                      className="input w-full"
                      value={newLeave.endDate}
                      onChange={e => setNewLeave({ ...newLeave, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Reason for Leave *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Provide a brief explanation for HR review..."
                    className="input w-full"
                    value={newLeave.reason}
                    onChange={e => setNewLeave({ ...newLeave, reason: e.target.value })}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowApplyModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
