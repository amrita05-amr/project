import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import Topbar from '../../components/Topbar'
import EmployeeModal from '../../components/EmployeeModal'
import { StatusBadge } from '../../lib/utils'
import { employeesApi } from '../../lib/api'
import { mockEmployees, mockPendingApprovals } from '../../lib/mockData'
import {
  Users, UserPlus, Search, Filter, Eye, CheckCircle, XCircle, Mail, Phone, Building, Plus, X
} from 'lucide-react'

export default function HREmployeesPage() {
  const [employees, setEmployees] = useState(mockEmployees)
  const [pending, setPending] = useState(mockPendingApprovals)
  const [selectedEmp, setSelectedEmp] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [deptFilter, setDeptFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newEmp, setNewEmp] = useState({
    name: '', email: '', department: 'Engineering', role: '', code: `EMP-2026-0${Math.floor(10 + Math.random() * 90)}`
  })

  // Load real employees from backend if available
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await employeesApi.list()
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const list = res.data.data.map(e => ({
            id: e.id,
            name: e.fullName || e.user?.email?.split('@')[0],
            department: e.department || 'General',
            role: 'Employee',
            status: e.registrationStatus === 'APPROVED' ? 'WORKING' : 'ABSENT',
            checkIn: '09:00 AM',
            hours: 7.5,
            location: 'Bangalore, IN',
            code: e.employeeCode,
            avatar: (e.fullName || 'E').slice(0, 2).toUpperCase(),
            email: e.user?.email
          }))
          // Merge with mock to give realistic experience
          setEmployees(prev => {
            const ids = new Set(list.map(l => l.id))
            return [...list, ...prev.filter(p => !ids.has(p.id))]
          })
        }
      } catch (err) {}
    }
    fetchEmployees()
  }, [])

  const handleDecision = async (id, decision) => {
    setPending(prev => prev.filter(p => p.id !== id))
    try {
      await employeesApi.approve(id, decision)
    } catch (e) {}
  }

  const handleAddEmployee = (e) => {
    e.preventDefault()
    if (!newEmp.name || !newEmp.email) return
    const created = {
      id: `emp-${Date.now()}`,
      name: newEmp.name,
      email: newEmp.email,
      department: newEmp.department,
      role: newEmp.role || 'Staff',
      code: newEmp.code,
      status: 'WORKING',
      checkIn: '09:00 AM',
      hours: 0,
      location: 'Bangalore, IN',
      avatar: newEmp.name.split(' ').map(w => w[0]).join('').toUpperCase()
    }
    setEmployees([created, ...employees])
    setShowAddModal(false)
    setNewEmp({ name: '', email: '', department: 'Engineering', role: '', code: `EMP-2026-0${Math.floor(10 + Math.random() * 90)}` })
  }

  const filtered = employees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (emp.code && emp.code.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesDept = deptFilter === 'ALL' || emp.department === deptFilter
    const matchesStatus = statusFilter === 'ALL' || emp.status === statusFilter
    return matchesSearch && matchesDept && matchesStatus
  })

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar title="Employee Directory" subtitle="Manage staff, onboarding approvals, and roles" onSearch={setSearchQuery} />
        <div className="page-content">

          {/* Top action bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div className="input-icon" style={{ width: 260 }}>
                <Search size={15} className="icon-left" />
                <input
                  className="input"
                  placeholder="Search by name, role or code..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: 36, fontSize: '0.8125rem' }}
                />
              </div>

              <select
                className="input"
                value={deptFilter}
                onChange={e => setDeptFilter(e.target.value)}
                style={{ fontSize: '0.8125rem', width: 140 }}
              >
                <option value="ALL">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
              </select>

              <select
                className="input"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ fontSize: '0.8125rem', width: 130 }}
              >
                <option value="ALL">All Statuses</option>
                <option value="WORKING">Working</option>
                <option value="ON_BREAK">On Break</option>
                <option value="ABSENT">Absent</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="CHECKED_OUT">Checked Out</option>
              </select>
            </div>

            <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add Employee
            </button>
          </div>

          {/* Pending Approvals alert banner */}
          {pending.length > 0 && (
            <div className="card mb-4" style={{ padding: 16, background: 'var(--indigo-50)', border: '1px solid var(--indigo-200)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="badge badge-primary">{pending.length} Pending</span>
                  <span className="font-semibold text-sm">New Employee Registrations Awaiting Verification</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                {pending.map(p => (
                  <div key={p.id} style={{ background: 'white', padding: '12px 14px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="text-xs text-muted">{p.department} · {p.code}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleDecision(p.id, 'APPROVE')}
                        className="btn btn-sm btn-icon-sm"
                        title="Approve"
                        style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button
                        onClick={() => handleDecision(p.id, 'REJECT')}
                        className="btn btn-sm btn-icon-sm"
                        title="Reject"
                        style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employees Table */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-base)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="font-semibold text-sm">All Employees ({filtered.length})</span>
            </div>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Employee Code</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Today Check-in</th>
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
                            <div className="text-xs text-muted">{emp.email || `${emp.name?.toLowerCase().replace(/\s+/g, '.')}@company.com`}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="text-xs font-mono font-medium">{emp.code || `EMP-${emp.id}`}</span></td>
                      <td><span className="text-sm">{emp.department}</span></td>
                      <td><span className="text-sm text-muted">{emp.role}</span></td>
                      <td><StatusBadge status={emp.status} /></td>
                      <td><span className="text-sm">{emp.checkIn || '—'}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn btn-icon-sm btn-ghost"
                          title="View Profile Details"
                          onClick={() => setSelectedEmp(emp)}
                        >
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No employees found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="font-semibold text-base">Add New Employee</span>
              <button className="btn btn-icon-sm btn-ghost" onClick={() => setShowAddModal(false)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAddEmployee}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Singhania"
                    value={newEmp.name}
                    onChange={e => setNewEmp({ ...newEmp, name: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Work Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. vikram@company.com"
                    value={newEmp.email}
                    onChange={e => setNewEmp({ ...newEmp, email: e.target.value })}
                    className="input w-full"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1">Department</label>
                    <select
                      value={newEmp.department}
                      onChange={e => setNewEmp({ ...newEmp, department: e.target.value })}
                      className="input w-full"
                    >
                      <option value="Engineering">Engineering</option>
                      <option value="Design">Design</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Sales">Sales</option>
                      <option value="Finance">Finance</option>
                      <option value="HR">HR</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted block mb-1">Designation / Role</label>
                    <input
                      type="text"
                      placeholder="e.g. Frontend Engineer"
                      value={newEmp.role}
                      onChange={e => setNewEmp({ ...newEmp, role: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted block mb-1">Employee Code</label>
                  <input
                    type="text"
                    value={newEmp.code}
                    onChange={e => setNewEmp({ ...newEmp, code: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Create Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Detail Modal */}
      {selectedEmp && (
        <EmployeeModal employee={selectedEmp} onClose={() => setSelectedEmp(null)} />
      )}
    </div>
  )
}
