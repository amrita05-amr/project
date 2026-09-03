import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../../components/Sidebar'
import Topbar from '../../components/Topbar'
import { StatusBadge, formatHours, formatDate } from '../../lib/utils'
import { useAuth } from '../../store/AuthContext'
import { attendanceApi, locationApi, leaveApi, messagesApi } from '../../lib/api'
import { mockAttendanceHistory, mockMessages, mockWeeklyHours, mockLeaveBalance } from '../../lib/mockData'
import { Clock, MapPin, LogIn, LogOut, Coffee, TrendingUp, Send, Calendar, ExternalLink } from 'lucide-react'

const HR_USER_UUID = '749caae8-2e9b-439a-82e9-e581912f0dcf'

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])
  return time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
}

const weekDays = ['Mon','Tue','Wed','Thu','Fri']

export default function EmployeeDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [checkedIn, setCheckedIn] = useState(false)
  const [dutyOn, setDutyOn] = useState(true)
  const [checkInTime, setCheckInTime] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [msgText, setMsgText] = useState('')
  const [msgs, setMsgs] = useState(mockMessages)
  const [history, setHistory] = useState(mockAttendanceHistory)
  const [leave, setLeave] = useState(mockLeaveBalance)
  const weeklyHours = mockWeeklyHours
  const maxHours = 10
  const heartbeatRef = useRef(null)
  const messagesContainerRef = useRef(null)

  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior
      })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [msgs])

  // Helper to get geolocation
  const getCoords = () => new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ lat: null, lng: null })
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve({ lat: null, lng: null }),
      { timeout: 5000 }
    )
  })

  // Poll status & fetch leave balance / history on mount
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const { data } = await attendanceApi.getStatus()
        if (data.data?.activeSession) {
          setCheckedIn(true)
          setSessionId(data.data.activeSession.id)
          setDutyOn(data.data.activeSession.dutyState === 'ON')
          setCheckInTime(new Date(data.data.activeSession.checkInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }))
        }
      } catch (e) {
        // Backend offline — keep mock state
      }
    }

    const fetchLeaveAndHistory = async () => {
      try {
        const [lRes, hRes] = await Promise.allSettled([
          leaveApi.getBalance(),
          attendanceApi.getHistory({ pageSize: 7 })
        ])
        if (lRes.status === 'fulfilled' && lRes.value.data?.data?.balance) {
          const b = lRes.value.data.data.balance
          setLeave({ entitled: b.entitledDays, used: b.usedDays, remaining: b.remainingDays })
        }
        if (hRes.status === 'fulfilled' && hRes.value.data?.data && Array.isArray(hRes.value.data.data) && hRes.value.data.data.length > 0) {
          setHistory(hRes.value.data.data.map(h => ({
            date: h.date,
            status: h.status,
            hours: h.totalHours || 0,
            checkIn: h.checkInAt ? new Date(h.checkInAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
            checkOut: h.checkOutAt ? new Date(h.checkOutAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : null,
          })))
        }
      } catch (e) {}
    }

    fetchStatus()
    fetchLeaveAndHistory()
  }, [])

  // Location Heartbeat every 30 minutes (or on duty state)
  useEffect(() => {
    if (checkedIn && dutyOn && sessionId) {
      const sendHeartbeat = async () => {
        const coords = await getCoords()
        if (coords.lat && coords.lng) {
          try {
            await locationApi.updateHeartbeat({ sessionId, lat: coords.lat, lng: coords.lng })
          } catch (e) {}
        }
      }
      heartbeatRef.current = setInterval(sendHeartbeat, 30 * 60 * 1000)
    } else {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    }
    return () => { if (heartbeatRef.current) clearInterval(heartbeatRef.current) }
  }, [checkedIn, dutyOn, sessionId])

  const handleCheckIn = async () => {
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    setCheckedIn(true)
    setDutyOn(true)
    setCheckInTime(timeStr)

    try {
      const coords = await getCoords()
      const idemKey = `checkin-${user?.id || 'emp'}-${Date.now()}`
      const res = await attendanceApi.checkIn({
        lat: coords.lat,
        lng: coords.lng,
        idempotencyKey: idemKey
      })
      if (res.data?.data?.session?.id) {
        setSessionId(res.data.data.session.id)
      }
    } catch (e) {
      console.warn('[Attendance] Check-in API offline, using local session state.')
    }
  }

  const handleCheckOut = async () => {
    setCheckedIn(false)
    setDutyOn(true)

    try {
      if (sessionId) {
        await attendanceApi.checkOut({ sessionId })
      }
    } catch (e) {
      console.warn('[Attendance] Check-out API offline, updated local state.')
    }
    setSessionId(null)
  }

  const handleToggleDuty = async () => {
    const nextState = !dutyOn
    setDutyOn(nextState)

    try {
      await attendanceApi.toggleDuty(nextState ? 'ON' : 'OFF')
    } catch (e) {
      console.warn('[Attendance] Duty toggle API offline, updated local state.')
    }
  }

  const sendMsg = async () => {
    if (!msgText.trim()) return
    const text = msgText.trim()
    const newMsg = {
      id: Date.now(),
      sender: 'Me',
      body: text,
      sentAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      isOwn: true
    }
    setMsgs(m => [...m, newMsg])
    setMsgText('')

    try {
      await messagesApi.send(HR_USER_UUID, text)
    } catch (e) {
      console.warn('[Messaging] Saved locally')
    }

    // Auto reply simulation after 1 second
    setTimeout(() => {
      const autoReply = {
        id: Date.now() + 1,
        sender: 'HR',
        body: 'Noted! We have received your message and will check on this.',
        sentAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        isOwn: false
      }
      setMsgs(m => [...m, autoReply])
    }, 1200)
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar title="My Dashboard" subtitle={`Welcome back, ${user?.name?.split(' ')[0]}!`} />
        <div className="page-content">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 360px', gap: 20 }}>

            {/* Check-in Widget */}
            <div className="checkin-widget animate-fade-in-up">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 4 }}>
                {checkedIn && <span className="live-dot" />}
                <span className="text-xs font-semibold" style={{ color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {checkedIn ? (dutyOn ? 'On Duty' : 'On Break') : 'Not Checked In'}
                </span>
              </div>
              <div className="checkin-time"><LiveClock /></div>
              <div className="checkin-date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>

              {checkedIn && checkInTime && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
                  <LogIn size={13} color="var(--color-success)" />
                  <span className="text-xs text-muted">Checked in at <b>{checkInTime}</b></span>
                </div>
              )}

              {!checkedIn ? (
                <button className="checkin-btn checkin-btn-in" onClick={handleCheckIn}>
                  <LogIn size={18} style={{ marginRight: 8 }} />
                  Check In Now
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    className="btn"
                    style={{ background: dutyOn ? 'var(--color-warning-bg)' : 'var(--color-success-bg)', color: dutyOn ? 'var(--color-warning)' : 'var(--color-success)', border: `1px solid ${dutyOn ? 'var(--color-warning-ring)' : 'var(--color-success-ring)'}`, width: '100%', padding: '11px', fontWeight: 600 }}
                    onClick={handleToggleDuty}
                  >
                    <Coffee size={16} style={{ marginRight: 8 }} />
                    {dutyOn ? 'Take a Break' : 'Resume Duty'}
                  </button>
                  <button className="checkin-btn checkin-btn-out" onClick={handleCheckOut}>
                    <LogOut size={16} style={{ marginRight: 8 }} />
                    Check Out
                  </button>
                </div>
              )}
            </div>

            {/* Weekly Hours Chart */}
            <div className="card animate-fade-in-up stagger-1">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div className="font-semibold text-sm">Weekly Hours</div>
                  <div className="text-xs text-muted">Sep 1 – Sep 7, 2026</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-success-bg)', padding: '4px 10px', borderRadius: 'var(--radius-full)', border: '1px solid var(--color-success-ring)' }}>
                  <TrendingUp size={12} color="var(--color-success)" />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-success)' }}>38.5h / 40h</span>
                </div>
              </div>

              {/* Bar chart */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100, marginBottom: 12 }}>
                {weeklyHours.map((d, i) => (
                  <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-primary)' }}>{d.hours}h</span>
                    <div
                      style={{
                        width: '100%',
                        borderRadius: '6px 6px 3px 3px',
                        background: i === weeklyHours.length - 1 ? 'var(--color-primary)' : 'var(--indigo-200)',
                        height: `${(d.hours / maxHours) * 100}%`,
                        minHeight: 4,
                        transition: 'height 0.6s var(--ease-out)',
                        boxShadow: i === weeklyHours.length - 1 ? 'var(--shadow-primary)' : 'none',
                      }}
                    />
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>{d.day}</span>
                  </div>
                ))}
              </div>

              <div className="divider" />

              {/* Leave balance */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="text-xs font-semibold">Leave Balance</span>
                  <button
                    onClick={() => navigate('/leaves')}
                    className="text-xs font-bold"
                    style={{ color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    {leave.remaining} / {leave.entitled} days <ExternalLink size={11} />
                  </button>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${(leave.remaining / leave.entitled) * 100}%` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                  <span className="text-xs text-muted">{leave.used} used</span>
                  <span className="text-xs text-muted">{leave.remaining} remaining</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="card animate-fade-in-up stagger-2" style={{ display: 'flex', flexDirection: 'column', padding: 0, maxHeight: 420 }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div className="font-semibold text-sm">Messages</div>
                  <div className="text-xs text-muted">Chat with HR</div>
                </div>
                <button
                  onClick={() => navigate('/messages')}
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                >
                  Open Full Chat <ExternalLink size={12} style={{ marginLeft: 4 }} />
                </button>
              </div>
              <div className="messages-container" ref={messagesContainerRef} style={{ flex: 1, padding: '16px' }}>
                {msgs.map(m => (
                  <div key={m.id} className={`message-row ${m.isOwn ? 'sent' : ''}`}>
                    {!m.isOwn && <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, var(--color-success), #047857)' }}>HR</div>}
                    <div>
                      <div className={`message-bubble ${m.isOwn ? 'sent' : 'received'}`}>{m.body}</div>
                      <div className="message-time" style={{ textAlign: m.isOwn ? 'right' : 'left' }}>{m.sentAt}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-base)' }}>
                <div className="message-input-row">
                  <textarea
                    className="message-input"
                    placeholder="Type a message…"
                    value={msgText}
                    onChange={e => setMsgText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg() } }}
                    rows={1}
                  />
                  <button className="btn btn-primary btn-icon" onClick={sendMsg}><Send size={15} /></button>
                </div>
              </div>
            </div>

          </div>

          {/* Attendance History */}
          <div className="card" style={{ marginTop: 20, padding: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="font-semibold text-sm">Attendance History</div>
                <div className="text-xs text-muted">Last 7 days</div>
              </div>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => navigate('/attendance')}
              >
                <Calendar size={13} style={{ marginRight: 4 }} />View All
              </button>
            </div>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table className="data-table">
                <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Hours Worked</th><th>Status</th></tr></thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={h.date} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                      <td><span className="text-sm font-medium">{formatDate(h.date)}</span></td>
                      <td><span className="text-sm">{h.checkIn || '—'}</span></td>
                      <td><span className="text-sm">{h.checkOut || (h.status === 'WORKING' ? <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>Active</span> : '—')}</span></td>
                      <td><span className="font-semibold text-sm" style={{ color: h.hours > 0 ? 'var(--color-primary)' : 'var(--text-muted)' }}>{formatHours(h.hours)}</span></td>
                      <td><StatusBadge status={h.status} /></td>
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
