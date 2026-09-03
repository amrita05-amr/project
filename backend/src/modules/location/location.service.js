const prisma = require('../../lib/prisma')
const { ok, created, badRequest } = require('../../lib/response')

// POST /location/update — periodic heartbeat
const updateLocation = async (req, res, next) => {
  try {
    const { sessionId, lat, lng, accuracy } = req.body
    const employeeId = req.user.employeeId

    // Verify session is active and belongs to this employee
    const session = await prisma.attendanceSession.findFirst({
      where: { id: sessionId, employeeId, status: 'ACTIVE' }
    })
    if (!session) return badRequest(res, 'No active session found for this employee')

    // Only record heartbeat if duty is ON
    if (session.dutyState !== 'ON') {
      return ok(res, { message: 'Duty is OFF — location not recorded' })
    }

    // Dedup: skip if there's already a heartbeat within 60 seconds
    const recent = await prisma.locationRecord.findFirst({
      where: {
        attendanceSessionId: sessionId,
        recordedAt: { gte: new Date(Date.now() - 60_000) },
        source: 'HEARTBEAT'
      }
    })
    if (recent) return ok(res, { message: 'Heartbeat already recorded recently', deduplicated: true })

    const record = await prisma.locationRecord.create({
      data: {
        attendanceSessionId: sessionId,
        latitude: lat,
        longitude: lng,
        accuracyMeters: accuracy || null,
        recordedAt: new Date(),
        source: 'HEARTBEAT',
      }
    })

    return ok(res, { record })
  } catch (err) { next(err) }
}

// GET /hr/locations — latest location per active employee (HR only)
const getLatestLocations = async (req, res, next) => {
  try {
    // Get all active sessions
    const activeSessions = await prisma.attendanceSession.findMany({
      where: { status: 'ACTIVE' },
      include: {
        employee: { select: { id: true, fullName: true, department: true } },
        locationRecords: {
          orderBy: { recordedAt: 'desc' },
          take: 1,
        }
      }
    })

    const staleThresholdMs = parseInt(process.env.LOCATION_HEARTBEAT_STALE_MINUTES || '45') * 60 * 1000
    const now = Date.now()

    const locations = activeSessions.map(s => {
      const latest = s.locationRecords[0]
      const isStale = latest ? (now - new Date(latest.recordedAt).getTime()) > staleThresholdMs : true
      return {
        employeeId: s.employee.id,
        employeeName: s.employee.fullName,
        department: s.employee.department,
        sessionId: s.id,
        dutyState: s.dutyState,
        lat: latest?.latitude || null,
        lng: latest?.longitude || null,
        lastUpdatedAt: latest?.recordedAt || null,
        isStale,
      }
    })

    return ok(res, { locations })
  } catch (err) { next(err) }
}

module.exports = { updateLocation, getLatestLocations }
