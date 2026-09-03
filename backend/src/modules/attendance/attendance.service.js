const prisma = require('../../lib/prisma')
const { ok, created, conflict, notFound, badRequest, forbidden } = require('../../lib/response')
const workingHoursService = require('../workingHours/workingHours.service')
const auditService = require('../audit/audit.service')

// POST /attendance/check-in
const checkIn = async (req, res, next) => {
  try {
    const { lat, lng, idempotencyKey } = req.body
    const employeeId = req.user.employeeId

    if (!employeeId) return forbidden(res, 'Only employees can check in')

    // Idempotency check
    if (idempotencyKey) {
      const existing = await prisma.attendanceSession.findUnique({ where: { idempotencyKey } })
      if (existing) return ok(res, { session: existing, message: 'Already checked in (idempotent)' })
    }

    // Check for existing active session (DB-level enforcement via unique partial index handled by Prisma)
    const activeSession = await prisma.attendanceSession.findFirst({
      where: { employeeId, status: 'ACTIVE' }
    })
    if (activeSession) return conflict(res, 'Already checked in. Please check out first.')

    const now = new Date()

    const session = await prisma.$transaction(async (tx) => {
      const s = await tx.attendanceSession.create({
        data: {
          employeeId,
          checkInAt: now,
          checkInLat: lat || null,
          checkInLng: lng || null,
          status: 'ACTIVE',
          dutyState: 'ON',
          idempotencyKey: idempotencyKey || null,
        }
      })

      // Create/upsert daily Attendance rollup
      await tx.attendance.upsert({
        where: { employeeId_date: { employeeId, date: new Date(now.toDateString()) } },
        update: { status: 'WORKING', sessionCount: { increment: 1 } },
        create: {
          employeeId,
          date: new Date(now.toDateString()),
          status: 'WORKING',
          totalHours: 0,
          sessionCount: 1,
        }
      })

      // Location record for check-in
      if (lat && lng) {
        await tx.locationRecord.create({
          data: { attendanceSessionId: s.id, latitude: lat, longitude: lng, recordedAt: now, source: 'CHECK_IN' }
        })
      }

      return s
    })

    await auditService.log({ actorId: req.user.id, action: 'CHECK_IN', entityType: 'AttendanceSession', entityId: session.id, afterState: { status: 'ACTIVE', checkInAt: now } })

    return created(res, { session, status: 'WORKING' })
  } catch (err) { next(err) }
}

// POST /attendance/check-out
const checkOut = async (req, res, next) => {
  try {
    const { sessionId, idempotencyKey } = req.body
    const employeeId = req.user.employeeId

    if (!employeeId) return forbidden(res, 'Only employees can check out')

    const session = await prisma.attendanceSession.findFirst({
      where: { id: sessionId || undefined, employeeId, status: 'ACTIVE' }
    })

    if (!session) return conflict(res, 'No active session found to check out.')

    const now = new Date()

    // Compute hours
    const computedHours = workingHoursService.computeSessionHours(session.checkInAt, now)

    const updatedSession = await prisma.$transaction(async (tx) => {
      const s = await tx.attendanceSession.update({
        where: { id: session.id },
        data: { checkOutAt: now, status: 'CLOSED', computedHours }
      })

      // Update daily rollup
      const todayAttendance = await tx.attendance.findUnique({
        where: { employeeId_date: { employeeId, date: new Date(now.toDateString()) } }
      })
      if (todayAttendance) {
        await tx.attendance.update({
          where: { id: todayAttendance.id },
          data: { status: 'CHECKED_OUT', totalHours: { increment: computedHours } }
        })
      }

      return s
    })

    await auditService.log({ actorId: req.user.id, action: 'CHECK_OUT', entityType: 'AttendanceSession', entityId: session.id, beforeState: { status: 'ACTIVE' }, afterState: { status: 'CLOSED', computedHours } })

    return ok(res, { session: updatedSession, computedHours, status: 'CHECKED_OUT' })
  } catch (err) { next(err) }
}

// POST /attendance/duty
const toggleDuty = async (req, res, next) => {
  try {
    const { state } = req.body // 'ON' | 'OFF'
    const employeeId = req.user.employeeId

    const session = await prisma.attendanceSession.findFirst({
      where: { employeeId, status: 'ACTIVE' }
    })
    if (!session) return conflict(res, 'No active session. Check in first.')

    const updated = await prisma.attendanceSession.update({
      where: { id: session.id },
      data: { dutyState: state }
    })

    return ok(res, { session: updated, dutyState: state })
  } catch (err) { next(err) }
}

// GET /attendance/me — current status
const getMyStatus = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId
    const today = new Date(new Date().toDateString())

    const [activeSession, todayAttendance] = await Promise.all([
      prisma.attendanceSession.findFirst({ where: { employeeId, status: 'ACTIVE' } }),
      prisma.attendance.findUnique({ where: { employeeId_date: { employeeId, date: today } } })
    ])

    let status = 'NOT_CHECKED_IN'
    if (activeSession) {
      status = activeSession.dutyState === 'ON' ? 'WORKING' : 'ON_BREAK'
    } else if (todayAttendance?.status === 'CHECKED_OUT') {
      status = 'CHECKED_OUT'
    }

    return ok(res, { status, activeSession, todayAttendance })
  } catch (err) { next(err) }
}

// GET /attendance/history
const getHistory = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId
    const page = parseInt(req.query.page || '1')
    const pageSize = parseInt(req.query.pageSize || '10')
    const skip = (page - 1) * pageSize

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where: { employeeId },
        orderBy: { date: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.attendance.count({ where: { employeeId } })
    ])

    return res.json({ success: true, data: records, pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } })
  } catch (err) { next(err) }
}

module.exports = { checkIn, checkOut, toggleDuty, getMyStatus, getHistory }
