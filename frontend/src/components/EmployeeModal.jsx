import { X, Mail, Phone, MapPin, Clock, Calendar, Shield, MessageSquare } from 'lucide-react'
import { StatusBadge, formatHours } from '../lib/utils'
import { useNavigate } from 'react-router-dom'

export default function EmployeeModal({ employee, onClose }) {
  const navigate = useNavigate()
  if (!employee) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar avatar-md">{employee.avatar || employee.name?.slice(0, 2).toUpperCase()}</div>
            <div>
              <div className="font-semibold text-base">{employee.name}</div>
              <div className="text-xs text-muted">{employee.role} · {employee.department}</div>
            </div>
          </div>
          <button className="btn btn-icon-sm btn-ghost" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)' }}>
            <span className="text-xs text-muted font-medium">Current Status</span>
            <StatusBadge status={employee.status || 'WORKING'} />
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div className="text-xs text-muted mb-1 flex items-center gap-1.5"><Clock size={13} /> Today Check-In</div>
              <div className="text-sm font-semibold">{employee.checkIn || 'Not checked in'}</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div className="text-xs text-muted mb-1 flex items-center gap-1.5"><Calendar size={13} /> Hours Logged</div>
              <div className="text-sm font-semibold" style={{ color: 'var(--color-primary)' }}>{formatHours(employee.hours || 0)}</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div className="text-xs text-muted mb-1 flex items-center gap-1.5"><MapPin size={13} /> Last Location</div>
              <div className="text-sm font-medium">{employee.location || 'Bangalore Office'}</div>
            </div>
            <div style={{ padding: '12px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <div className="text-xs text-muted mb-1 flex items-center gap-1.5"><Shield size={13} /> Employee Code</div>
              <div className="text-sm font-medium">{employee.code || `EMP-${employee.id?.slice(0, 6)}`}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            <div className="text-xs font-semibold text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Information</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-base)' }}>
              <Mail size={14} color="var(--text-muted)" />
              <span className="text-xs">{employee.email || `${employee.name?.toLowerCase().replace(/\s+/g, '.')}@company.com`}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-base)' }}>
              <Phone size={14} color="var(--text-muted)" />
              <span className="text-xs">+91 98765 {Math.floor(10000 + Math.random() * 90000)}</span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Close</button>
          <button
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            onClick={() => {
              onClose()
              navigate('/hr/messages')
            }}
          >
            <MessageSquare size={14} /> Send Message
          </button>
        </div>
      </div>
    </div>
  )
}
