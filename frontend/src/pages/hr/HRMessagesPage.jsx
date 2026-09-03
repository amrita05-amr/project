import { useState, useEffect, useRef } from 'react'
import Sidebar from '../../components/Sidebar'
import Topbar from '../../components/Topbar'
import { messagesApi } from '../../lib/api'
import { useAuth } from '../../store/AuthContext'
import { Send, Search, User, Check, CheckCheck, MessageSquare, Phone, MoreVertical } from 'lucide-react'

const fallbackEmployees = [
  { id: '8ff17084-4df7-49b8-a65c-649b5becfdeb', name: 'Aarav Sharma', role: 'Senior Developer', department: 'Engineering', code: 'EMP-2026-001' },
  { id: 'usr-p1', name: 'Priya Nair', role: 'UI/UX Lead', department: 'Design', code: 'EMP-2026-002' },
  { id: 'usr-k1', name: 'Karan Mehta', role: 'Sales Manager', department: 'Sales', code: 'EMP-2026-005' },
  { id: 'usr-s1', name: 'Sneha Patel', role: 'Backend Engineer', department: 'Engineering', code: 'EMP-2026-004' },
]

export default function HRMessagesPage() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState(fallbackEmployees)
  const [selectedContact, setSelectedContact] = useState(fallbackEmployees[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [msgText, setMsgText] = useState('')
  const [threads, setThreads] = useState({
    '8ff17084-4df7-49b8-a65c-649b5becfdeb': [
      { id: 'm1', sender: 'HR', body: 'Hi Aarav! Your attendance record for August looks great. Keep it up!', sentAt: '02:30 PM', isOwn: true },
      { id: 'm2', sender: 'Aarav Sharma', body: 'Thank you! Will continue to maintain the same.', sentAt: '02:32 PM', isOwn: false },
      { id: 'm3', sender: 'HR', body: 'Please ensure you submit your leave request for next week via the portal.', sentAt: '03:15 PM', isOwn: true },
      { id: 'm4', sender: 'Aarav Sharma', body: 'Sure, I will do that today itself.', sentAt: '03:18 PM', isOwn: false },
    ]
  })
  const messagesContainerRef = useRef(null)

  // Scroll to bottom
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
  }, [selectedContact, threads])

  // Fetch real contacts from backend
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const res = await messagesApi.getContacts()
        if (res.data?.data?.contacts && res.data.data.contacts.length > 0) {
          const list = res.data.data.contacts
          setContacts(list)
          if (!list.find(c => c.id === selectedContact?.id)) {
            setSelectedContact(list[0])
          }
        }
      } catch (err) {}
    }
    fetchContacts()
  }, [])

  // Fetch thread if UUID
  useEffect(() => {
    const loadThread = async () => {
      if (!selectedContact?.id || !selectedContact.id.includes('-') || selectedContact.id.startsWith('usr-')) return
      try {
        const res = await messagesApi.getThread(selectedContact.id)
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const fetched = res.data.data.map(m => ({
            id: m.id,
            sender: m.senderId === user?.id ? 'HR' : selectedContact.name,
            body: m.body,
            sentAt: new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: m.senderId === user?.id
          }))
          setThreads(prev => ({ ...prev, [selectedContact.id]: fetched }))
        }
      } catch (e) {}
    }
    loadThread()
  }, [selectedContact, user])

  const handleSend = async () => {
    if (!msgText.trim() || !selectedContact) return
    const text = msgText.trim()
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'HR',
      body: text,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true
    }

    setThreads(prev => ({
      ...prev,
      [selectedContact.id]: [...(prev[selectedContact.id] || []), newMsg]
    }))
    setMsgText('')

    // Try backend if valid UUID
    try {
      if (selectedContact.id.length > 20 && !selectedContact.id.startsWith('usr-')) {
        await messagesApi.send(selectedContact.id, text)
      }
    } catch (e) {
      console.warn('[Messaging] Sent locally')
    }
  }

  const activeMessages = (selectedContact && threads[selectedContact.id]) || []
  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.department && c.department.toLowerCase().includes(searchQuery.toLowerCase())))

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar title="Messages & Communications" subtitle="Direct secure messaging with employees and managers" />
        <div className="page-content" style={{ padding: 0, height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '100%', background: 'var(--bg-surface)' }}>

            {/* Left Column: Contact List */}
            <div style={{ borderRight: '1px solid var(--border-base)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-base)' }}>
                <div className="input-icon w-full">
                  <Search size={15} className="icon-left" />
                  <input
                    className="input w-full"
                    placeholder="Search employees..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: 34, fontSize: '0.8125rem' }}
                  />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filteredContacts.map(c => {
                  const isSelected = selectedContact?.id === c.id
                  const lastMsg = threads[c.id]?.[threads[c.id].length - 1]
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedContact(c)}
                      style={{
                        padding: '14px 16px',
                        borderBottom: '1px solid var(--border-base)',
                        background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                        borderLeft: isSelected ? '3px solid var(--color-primary)' : '3px solid transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar avatar-sm">{c.name.split(' ').map(w => w[0]).join('').toUpperCase()}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold truncate">{c.name}</span>
                            {lastMsg && <span className="text-muted" style={{ fontSize: '0.65rem' }}>{lastMsg.sentAt}</span>}
                          </div>
                          <div className="text-xs text-muted truncate" style={{ marginTop: 2 }}>
                            {lastMsg ? lastMsg.body : `${c.department} · ${c.role || 'Staff'}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right Column: Chat Window */}
            {selectedContact ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Chat Header */}
                <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="avatar avatar-sm">{selectedContact.name.split(' ').map(w => w[0]).join('').toUpperCase()}</div>
                    <div>
                      <div className="font-semibold text-sm">{selectedContact.name}</div>
                      <div className="text-xs text-muted">{selectedContact.department} · {selectedContact.role || 'Employee'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge badge-success flex items-center gap-1">
                      <span className="live-dot" style={{ width: 6, height: 6 }} /> Active
                    </span>
                  </div>
                </div>

                {/* Messages Area */}
                <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '24px', background: 'var(--bg-subtle)' }}>
                  <div className="messages-container" style={{ maxHeight: 'none' }}>
                    {activeMessages.map((m, idx) => (
                      <div key={m.id || idx} className={`message-row ${m.isOwn ? 'sent' : ''}`}>
                        {!m.isOwn && (
                          <div className="avatar avatar-sm">{selectedContact.name.slice(0, 2).toUpperCase()}</div>
                        )}
                        <div>
                          <div className={`message-bubble ${m.isOwn ? 'sent' : 'received'}`}>{m.body}</div>
                          <div className="message-time" style={{ textAlign: m.isOwn ? 'right' : 'left' }}>
                            {m.sentAt} {m.isOwn && <CheckCheck size={11} style={{ display: 'inline', marginLeft: 3, verticalAlign: 'middle', color: '#93C5FD' }} />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Reply Chips */}
                <div style={{ padding: '8px 20px 0', display: 'flex', gap: 8, background: 'var(--bg-surface)', flexWrap: 'wrap' }}>
                  {['Approved, thank you!', 'Please update your timesheet', 'Acknowledged and noted'].map(chip => (
                    <button
                      key={chip}
                      onClick={() => setMsgText(chip)}
                      className="badge"
                      style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-base)', cursor: 'pointer', padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Chat Input */}
                <div style={{ padding: '12px 20px 16px', background: 'var(--bg-surface)' }}>
                  <div className="message-input-row" style={{ marginTop: 0 }}>
                    <textarea
                      className="message-input"
                      placeholder={`Message ${selectedContact.name}...`}
                      value={msgText}
                      onChange={e => setMsgText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                      rows={1}
                    />
                    <button
                      className="btn btn-primary btn-icon"
                      onClick={handleSend}
                      disabled={!msgText.trim()}
                      title="Send message (Enter)"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                Select an employee to start a conversation.
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
