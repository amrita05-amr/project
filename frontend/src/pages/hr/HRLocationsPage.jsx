import { useState, useEffect } from 'react'
import Sidebar from '../../components/Sidebar'
import Topbar from '../../components/Topbar'
import { locationApi } from '../../lib/api'
import { MapPin, Radio, AlertTriangle, RefreshCw, CheckCircle, Navigation, ShieldCheck, Clock } from 'lucide-react'

const mockLocations = [
  { id: 'loc-1', employeeName: 'Aarav Sharma', department: 'Engineering', lat: 19.0760, lng: 72.8777, locationName: 'Mumbai HQ (Main Campus)', isInsideGeofence: true, lastHeartbeat: '2 mins ago', isStale: false, accuracy: '8m' },
  { id: 'loc-2', employeeName: 'Priya Nair', department: 'Design', lat: 12.9716, lng: 77.5946, locationName: 'Bangalore Innovation Hub', isInsideGeofence: true, lastHeartbeat: '8 mins ago', isStale: false, accuracy: '12m' },
  { id: 'loc-3', employeeName: 'Karan Mehta', department: 'Sales', lat: 28.6139, lng: 77.2090, locationName: 'Delhi Client Site (Connaught Place)', isInsideGeofence: false, lastHeartbeat: '15 mins ago', isStale: false, accuracy: '15m' },
  { id: 'loc-4', employeeName: 'Meera Iyer', department: 'Engineering', lat: 13.0827, lng: 80.2707, locationName: 'Chennai Tech Park', isInsideGeofence: true, lastHeartbeat: '52 mins ago', isStale: true, accuracy: '25m' },
  { id: 'loc-5', employeeName: 'Vikram Rao', department: 'Finance', lat: 18.5204, lng: 73.8567, locationName: 'Pune Branch', isInsideGeofence: true, lastHeartbeat: '5 mins ago', isStale: false, accuracy: '10m' },
]

export default function HRLocationsPage() {
  const [locations, setLocations] = useState(mockLocations)
  const [selectedLoc, setSelectedLoc] = useState(mockLocations[0])
  const [isPinging, setIsPinging] = useState(false)
  const [pingSuccess, setPingSuccess] = useState(null)

  const handlePingLocation = (id, name) => {
    setIsPinging(true)
    setTimeout(() => {
      setIsPinging(false)
      setPingSuccess(`Pinged GPS beacon for ${name} — Signal verified!`)
      setLocations(prev => prev.map(l => l.id === id ? { ...l, lastHeartbeat: 'Just now', isStale: false } : l))
      setTimeout(() => setPingSuccess(null), 4000)
    }, 800)
  }

  const staleCount = locations.filter(l => l.isStale).length

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <Topbar title="Live Location & Geofence Tracker" subtitle="Real-time GPS telemetry, geofence compliance, and stale signal alerts" />
        <div className="page-content">

          {/* Alert banner if stale */}
          {staleCount > 0 && (
            <div className="mb-4" style={{ background: 'var(--color-warning-bg)', border: '1px solid var(--color-warning-ring)', borderRadius: 'var(--radius-lg)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <AlertTriangle size={20} color="var(--color-warning)" />
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--color-warning)' }}>
                    {staleCount} Employee Signal(s) Require Attention
                  </div>
                  <div className="text-xs text-muted">Heartbeat signal has not been received within the 45-minute threshold.</div>
                </div>
              </div>
              <button
                className="btn btn-sm"
                style={{ background: 'white', color: 'var(--color-warning)', border: '1px solid var(--color-warning-ring)' }}
                onClick={() => {
                  setLocations(locations.map(l => ({ ...l, isStale: false, lastHeartbeat: 'Just now' })))
                  setPingSuccess('Refreshed all employee location telemetry.')
                  setTimeout(() => setPingSuccess(null), 3000)
                }}
              >
                Refresh All Signals
              </button>
            </div>
          )}

          {pingSuccess && (
            <div className="animate-fade-in mb-4" style={{ padding: '12px 16px', background: 'var(--color-success-bg)', border: '1px solid var(--color-success-ring)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle size={16} color="var(--color-success)" />
              <span className="text-xs font-semibold" style={{ color: 'var(--color-success)' }}>{pingSuccess}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
            {/* Visual Radar / Map Simulator */}
            <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-base)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Radio size={16} color="var(--color-primary)" className="animate-pulse" />
                  <span className="font-semibold text-sm">Active Geofence Radar</span>
                </div>
                <span className="badge badge-success flex items-center gap-1">
                  <span className="live-dot" style={{ width: 6, height: 6 }} /> Live GPS Telemetry
                </span>
              </div>

              {/* Map Canvas Mockup */}
              <div style={{ position: 'relative', height: 420, background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {/* Grid lines */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)',
                  backgroundSize: '24px 24px'
                }} />

                {/* Concentric radar circles */}
                <div style={{ position: 'absolute', width: 340, height: 340, borderRadius: '50%', border: '1px solid rgba(99, 102, 241, 0.2)' }} />
                <div style={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', border: '1px solid rgba(99, 102, 241, 0.3)' }} />
                <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: '1px dashed rgba(99, 102, 241, 0.4)' }} />

                {/* Geofence zone */}
                <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.08)', border: '1.5px dashed rgba(16, 185, 129, 0.4)', pointerEvents: 'none' }} />

                {/* Center marker */}
                <div style={{ position: 'absolute', color: 'white', fontSize: '0.7rem', fontWeight: 600, background: 'rgba(15,23,42,0.8)', padding: '2px 8px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)' }}>
                  Office Geofence (500m)
                </div>

                {/* Pin markers */}
                {locations.map((loc, idx) => {
                  // Distribute positions visually
                  const offsets = [
                    { top: '35%', left: '42%' },
                    { top: '55%', left: '52%' },
                    { top: '25%', left: '72%' },
                    { top: '68%', left: '32%' },
                    { top: '42%', left: '60%' }
                  ]
                  const pos = offsets[idx % offsets.length]
                  const isSelected = selectedLoc?.id === loc.id

                  return (
                    <div
                      key={loc.id}
                      onClick={() => setSelectedLoc(loc)}
                      style={{
                        position: 'absolute',
                        top: pos.top,
                        left: pos.left,
                        cursor: 'pointer',
                        transform: 'translate(-50%, -50%)',
                        zIndex: isSelected ? 10 : 2,
                        transition: 'transform 0.2s'
                      }}
                      title={`${loc.employeeName} (${loc.locationName})`}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        background: isSelected ? 'var(--color-primary)' : loc.isStale ? 'var(--color-danger)' : 'rgba(30, 41, 59, 0.9)',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        boxShadow: isSelected ? '0 0 15px rgba(99, 102, 241, 0.8)' : '0 4px 6px rgba(0,0,0,0.3)',
                        border: isSelected ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        <MapPin size={12} color={loc.isStale ? '#FECACA' : '#A7F3D0'} />
                        {loc.employeeName.split(' ')[0]}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Map Footer Info */}
              <div style={{ padding: '12px 20px', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1.5"><ShieldCheck size={14} color="var(--color-success)" /> GPS Anti-Spoofing & Geofence Active</span>
                <span>Coordinates: {selectedLoc?.lat.toFixed(4)}, {selectedLoc?.lng.toFixed(4)}</span>
              </div>
            </div>

            {/* Right Panel: Selected Employee Details & Action */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selectedLoc && (
                <div className="card">
                  <div className="font-semibold text-sm mb-3">Beacon Telemetry</div>

                  <div style={{ padding: '14px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-base)', marginBottom: 14 }}>
                    <div className="font-bold text-base">{selectedLoc.employeeName}</div>
                    <div className="text-xs text-muted mb-3">{selectedLoc.department}</div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">Geofence Compliance:</span>
                        <span className={`badge ${selectedLoc.isInsideGeofence ? 'badge-success' : 'badge-warning'}`}>
                          {selectedLoc.isInsideGeofence ? 'Inside Campus' : 'Remote / Offsite'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">Last Heartbeat:</span>
                        <span className="font-medium flex items-center gap-1">
                          <Clock size={12} /> {selectedLoc.lastHeartbeat}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">GPS Accuracy:</span>
                        <span className="font-medium">{selectedLoc.accuracy}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted">Reported Area:</span>
                        <span className="font-medium text-right" style={{ maxWidth: 160 }}>{selectedLoc.locationName}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                    disabled={isPinging}
                    onClick={() => handlePingLocation(selectedLoc.id, selectedLoc.employeeName)}
                  >
                    <RefreshCw size={15} className={isPinging ? 'animate-spin' : ''} />
                    {isPinging ? 'Requesting GPS Beacon...' : 'Ping Current Location'}
                  </button>
                </div>
              )}

              {/* Employee location list */}
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-base)', fontSize: '0.8125rem', fontWeight: 600 }}>
                  Monitored Devices ({locations.length})
                </div>
                <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                  {locations.map(loc => (
                    <div
                      key={loc.id}
                      onClick={() => setSelectedLoc(loc)}
                      style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid var(--border-base)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        background: selectedLoc?.id === loc.id ? 'var(--bg-elevated)' : 'transparent'
                      }}
                    >
                      <div>
                        <div className="text-xs font-semibold">{loc.employeeName}</div>
                        <div className="text-xs text-muted truncate" style={{ maxWidth: 160 }}>{loc.locationName}</div>
                      </div>
                      <span className={`badge ${loc.isStale ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.65rem' }}>
                        {loc.isStale ? 'Stale' : 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
