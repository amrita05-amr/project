export function getStatusBadge(status) {
  const map = {
    WORKING:     { label: 'Working',     cls: 'badge-working',    dot: 'dot-green' },
    ABSENT:      { label: 'Absent',      cls: 'badge-absent',     dot: 'dot-red' },
    ON_LEAVE:    { label: 'On Leave',    cls: 'badge-leave',      dot: 'dot-blue' },
    ON_BREAK:    { label: 'On Break',    cls: 'badge-break',      dot: 'dot-amber' },
    CHECKED_OUT: { label: 'Checked Out', cls: 'badge-checked-out',dot: 'dot-gray' },
    PENDING:     { label: 'Pending',     cls: 'badge-pending',    dot: 'dot-amber' },
    APPROVED:    { label: 'Approved',    cls: 'badge-working',    dot: 'dot-green' },
    REJECTED:    { label: 'Rejected',    cls: 'badge-absent',     dot: 'dot-red' },
  }
  return map[status] || { label: status, cls: 'badge-checked-out', dot: 'dot-gray' }
}

export function StatusBadge({ status }) {
  const { label, cls, dot } = getStatusBadge(status)
  return (
    <span className={`badge ${cls}`}>
      <span className={`status-dot ${dot}`} />
      {label}
    </span>
  )
}

export function formatHours(h) {
  if (!h) return '—'
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  if (mins === 0) return `${hrs}h`
  return `${hrs}h ${mins}m`
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}
