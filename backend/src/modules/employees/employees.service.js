const prisma = require('../../lib/prisma')
const { ok, created, notFound, conflict, forbidden, badRequest } = require('../../lib/response')
const auditService = require('../audit/audit.service')

// GET /employees — HR only, paginated list
const listEmployees = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1')
    const pageSize = parseInt(req.query.pageSize || '20')
    const status = req.query.status // filter by registrationStatus
    const skip = (page - 1) * pageSize

    const where = {}
    if (status) where.registrationStatus = status

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: { user: { select: { email: true, isActive: true } }, workSchedule: true },
        orderBy: { createdAt: 'desc' },
        skip, take: pageSize,
      }),
      prisma.employee.count({ where })
    ])

    return res.json({ success: true, data: employees, pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } })
  } catch (err) { next(err) }
}

// GET /employees/:id
const getEmployee = async (req, res, next) => {
  try {
    const { id } = req.params
    // Employees can only view themselves
    if (req.user.role === 'EMPLOYEE' && req.user.employeeId !== id) {
      return forbidden(res)
    }
    const emp = await prisma.employee.findUnique({
      where: { id },
      include: { user: { select: { email: true } }, workSchedule: true }
    })
    if (!emp) return notFound(res, 'Employee not found')
    return ok(res, { employee: emp })
  } catch (err) { next(err) }
}

// POST /employees/:id/approve — HR only
const approveEmployee = async (req, res, next) => {
  try {
    const { id } = req.params
    const { decision } = req.body // 'APPROVE' | 'REJECT'

    const emp = await prisma.employee.findUnique({ where: { id }, include: { user: true } })
    if (!emp) return notFound(res, 'Employee not found')
    if (emp.registrationStatus !== 'PENDING') return conflict(res, 'Registration already processed')

    const newStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'
    const updated = await prisma.$transaction(async (tx) => {
      const e = await tx.employee.update({
        where: { id },
        data: { registrationStatus: newStatus, approvedBy: req.user.id, approvedAt: new Date() }
      })
      // Create leave balance if approved
      if (newStatus === 'APPROVED') {
        await tx.leaveBalance.upsert({
          where: { employeeId_year: { employeeId: id, year: new Date().getFullYear() } },
          update: {},
          create: { employeeId: id, year: new Date().getFullYear(), entitledDays: 24, usedDays: 0, remainingDays: 24 }
        })
      }
      return e
    })

    await auditService.log({
      actorId: req.user.id,
      action: decision === 'APPROVE' ? 'EMPLOYEE_APPROVED' : 'EMPLOYEE_REJECTED',
      entityType: 'Employee',
      entityId: id,
      beforeState: { registrationStatus: 'PENDING' },
      afterState: { registrationStatus: newStatus }
    })

    return ok(res, { employee: updated })
  } catch (err) { next(err) }
}

// GET /hr/dashboard — aggregate counts with Redis cache
const getDashboard = async (req, res, next) => {
  try {
    const today = new Date(new Date().toDateString())

    const [totalEmployees, todayAttendances, pendingApprovals] = await Promise.all([
      prisma.employee.count({ where: { registrationStatus: 'APPROVED' } }),
      prisma.attendance.findMany({
        where: { date: today },
        select: { status: true }
      }),
      prisma.employee.count({ where: { registrationStatus: 'PENDING' } })
    ])

    const activeSessions = await prisma.attendanceSession.count({ where: { status: 'ACTIVE' } })

    const statusCounts = todayAttendances.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1
      return acc
    }, {})

    return ok(res, {
      total: totalEmployees,
      present: (statusCounts.WORKING || 0) + (statusCounts.ON_BREAK || 0) + (statusCounts.CHECKED_OUT || 0),
      working: statusCounts.WORKING || 0,
      onBreak: statusCounts.ON_BREAK || 0,
      absent: statusCounts.ABSENT || 0,
      onLeave: statusCounts.ON_LEAVE || 0,
      checkedOut: statusCounts.CHECKED_OUT || 0,
      pendingApprovals,
      activeSessions,
    })
  } catch (err) { next(err) }
}

// GET /hr/attendance — paginated per-employee attendance for HR
const getHRAttendance = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1')
    const pageSize = parseInt(req.query.pageSize || '20')
    const date = req.query.date ? new Date(req.query.date) : new Date(new Date().toDateString())
    const skip = (page - 1) * pageSize

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where: { date },
        include: { employee: { select: { fullName: true, department: true, employeeCode: true } } },
        orderBy: { employee: { fullName: 'asc' } },
        skip, take: pageSize,
      }),
      prisma.attendance.count({ where: { date } })
    ])

    return res.json({ success: true, data: records, pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } })
  } catch (err) { next(err) }
}

module.exports = { listEmployees, getEmployee, approveEmployee, getDashboard, getHRAttendance }
