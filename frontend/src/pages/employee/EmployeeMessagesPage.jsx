import { useState, useEffect, useRef } from 'react'
import Sidebar from '../../components/Sidebar'
import Topbar from '../../components/Topbar'
import { messagesApi } from '../../lib/api'
import { useAuth } from '../../store/AuthContext'
import { Send, CheckCheck, Clock, Shield, Sparkles, Search, MessageSquare, HelpCircle, Calendar, Bell } from 'lucide-react'

const HR_USER_UUID = '749caae8-2e9b-439a-82e9-e581912f0dcf'

const inboxChannels = [
  {
    id: 'channel-hr',
    title: 'HR People Operations',
    subtitle: 'Shift updates, attendance & team',
    icon: Shield,
    badge: 'Online',
    avatar: 'HR',
    recipientId: HR_USER_UUID
  },
  {
    id: 'channel-leaves',
    title: 'Leaves & PTO Approvals',
    subtitle: 'Annual leave, sick leaves & policy',
    icon: Calendar,
    badge: 'Desk',
    avatar: 'LP',
    recipientId: 'channel-leaves'
  },
  {
    id: 'channel-support',
    title: 'Helpdesk & Operations',
    subtitle: 'Biometrics, badge & office support',
    icon: HelpCircle,
    badge: 'Help',
    avatar: 'HD',
    recipientId: 'channel-support'
  }
]

export default function EmployeeMessagesPage() {
  const { user } = useAuth()
  const [selectedChannel, setSelectedChannel] = useState(inboxChannels[0])
  const [searchQuery, setSearchQuery] = useState('')
  const [channelMessages, setChannelMessages] = useState({
    'channel-hr': [
      { id: 'm1', sender: 'HR Support', body: 'Hi Aarav! Welcome to the AttendTrack portal. Let us know if you have any questions regarding your shifts or attendance.', sentAt: '09:00 AM', isOwn: false },
      { id: 'm2', sender: 'Me', body: 'Thank you! Will keep you posted.', sentAt: '09:05 AM', isOwn: true },
    ],
    'channel-leaves': [
      { id: 'ml1', sender: 'Leave Desk', body: 'Hello! Your leave request for Sep 18 - 19 is under review by your department lead.', sentAt: 'Yesterday', isOwn: false },
    ],
    'channel-support': [
      { id: 'ms1', sender: 'Helpdesk', body: 'Automated GPS heartbeat and geofence verification is currently operational.', sentAt: 'Sep 01', isOwn: false },
    ]
  })
  const [msgText, setMsgText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesContainerRef = useRef(null)

  const activeMessages = channelMessages[selectedChannel.id] || []

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
  }, [selectedChannel, activeMessages, isTyping])

  // Try fetching real thread from backend for HR channel
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await messagesApi.getThread(HR_USER_UUID)
        if (res.data?.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const list = res.data.data.map(m => ({
            id: m.id,
            sender: m.senderId === user?.id ? 'Me' : 'HR Support',
            body: m.body,
            sentAt: new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: m.senderId === user?.id
          }))
          setChannelMessages(prev => ({ ...prev, 'channel-hr': list }))
        }
      } catch (err) {}
    }
    fetchHistory()
  }, [user])

  const handleSend = async () => {
    if (!msgText.trim()) return
    const text = msgText.trim()
    const newMsg = {
      id: `msg-${Date.now()}`,
      sender: 'Me',
      body: text,
      sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOwn: true
    }

    setChannelMessages(prev => ({
      ...prev,
      [selectedChannel.id]: [...(prev[selectedChannel.id] || []), newMsg]
    }))
    setMsgText('')

    // If channel is HR, post to real API
    if (selectedChannel.id === 'channel-hr') {
      try {
        await messagesApi.send(HR_USER_UUID, text)
      } catch (e) {
        console.warn('[Messaging] Stored locally')
      }
    }

    // Auto-reply simulation
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
      const hrReplies = [
        "Received! We have logged your update in the system.",
        "Noted! HR operations will review this shortly.",
        "Thanks for informing us. Have a productive shift!",
        "Acknowledged and recorded."
      ]
      const randomReply = hrReplies[Math.floor(Math.random() * hrReplies.length)]
      const replyMsg = {
        id: `reply-${Date.now()}`,
        sender: selectedChannel.title,
        body: randomReply,
        sentAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: false
      }
      setChannelMessages(prev => ({
        ...prev,
        [selectedChannel.id]: [...(prev[selectedChannel.id] || []), replyMsg]
      }))
    }, 1100)
  }

  const filteredChannels = inboxChannels.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar title="Messages & Inbox" subtitle="Direct confidential communications with People Operations & Support" />
        <div className="page-content" style={{ padding: 0, height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', height: '100%', background: 'var(--bg-surface)' }}>

            {/* Left Column: Channels / Inbox */}
            <div style={{ borderRight: '1px solid var(--border-base)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-base)' }}>
                <div className="input-icon w-full">
                  <Search size={15} className="icon-left" />
                  <input
                    className="input w-full"
                    placeholder="Search inbox & channels..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: 34, fontSize: '0.8125rem' }}
                  />
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: '12px 16px 6px', fontSize: '0.6875rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  Support Channels
                </div>
                {filteredChannels.map(c => {
                  const isSelected = selectedChannel.id === c.id
                  const lastMsg = channelMessages[c.id]?.[channelMessages[c.id].length - 1]
                  const Icon = c.icon
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedChannel(c)}
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
                        <div
                          className="avatar avatar-sm"
                          style={{
                            background: isSelected ? 'var(--color-primary)' : 'var(--bg-subtle)',
                            color: isSelected ? 'white' : 'var(--text-primary)',
                            flexShrink: 0
                          }}
                        >
                          <Icon size={15} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold truncate">{c.title}</span>
                            {lastMsg && <span className="text-muted" style={{ fontSize: '0.65rem' }}>{lastMsg.sentAt}</span>}
                          </div>
                          <div className="text-xs text-muted truncate" style={{ marginTop: 2 }}>
                            {lastMsg ? lastMsg.body : c.subtitle}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Right Column: Chat Window */}
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-surface)' }}>

              {/* Chat Header */}
              <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, var(--color-primary), #3730A3)' }}>
                    {selectedChannel.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      {selectedChannel.title} <Shield size={13} color="var(--color-primary)" />
                    </div>
                    <div className="text-xs text-muted">{selectedChannel.subtitle}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="badge badge-success flex items-center gap-1">
                    <span className="live-dot" style={{ width: 6, height: 6 }} /> Active Channel
                  </span>
                </div>
              </div>

              {/* Messages Body */}
              <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#F8FAFC' }}>
                <div style={{ maxWidth: 760, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'flex-end' }}>
                  <div className="messages-container" style={{ maxHeight: 'none', width: '100%' }}>
                    {activeMessages.map((m, idx) => (
                      <div key={m.id || idx} className={`message-row ${m.isOwn ? 'sent' : ''}`}>
                        {!m.isOwn && (
                          <div className="avatar avatar-sm" style={{ background: 'linear-gradient(135deg, var(--color-primary), #3730A3)', flexShrink: 0 }}>
                            {selectedChannel.avatar}
                          </div>
                        )}
                        <div>
                          <div className={`message-bubble ${m.isOwn ? 'sent' : 'received'}`}>{m.body}</div>
                          <div className="message-time">
                            <span>{m.sentAt}</span>
                            {m.isOwn && <CheckCheck size={12} color="#93C5FD" />}
                          </div>
                        </div>
                      </div>
                    ))}

                    {isTyping && (
                      <div className="message-row">
                        <div className="avatar avatar-sm" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>HR</div>
                        <div>
                          <div className="message-bubble received" style={{ padding: '9px 16px', fontStyle: 'italic', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                            {selectedChannel.title} is typing...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat Bottom Action Area */}
              <div style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-base)', padding: '12px 20px 16px' }}>
                <div style={{ maxWidth: 760, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Suggestion Chips */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[
                      'Working from home today',
                      'Running 15 mins late due to transit',
                      'Question about my leave balance',
                      'Could you please approve my overtime?'
                    ].map(chip => (
                      <button
                        key={chip}
                        onClick={() => setMsgText(chip)}
                        className="badge"
                        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-base)', cursor: 'pointer', padding: '5px 12px', fontSize: '0.75rem' }}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>

                  {/* Input Row */}
                  <div className="message-input-row" style={{ marginTop: 0 }}>
                    <textarea
                      className="message-input"
                      placeholder={`Message ${selectedChannel.title}...`}
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

            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
