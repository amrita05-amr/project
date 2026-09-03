const prisma = require('../../lib/prisma')
const { ok, created, notFound, conflict } = require('../../lib/response')
const auditService = require('../audit/audit.service')

// POST /leaves — employee submits leave request
const createLeave = async (req, res, next) => {
  try {
    const { startDate, endDate, isPartialDay, partialHours, reason } = req.body
    const employeeId = req.user.employeeId

    const leave = await prisma.leaveRequest.create({
      data: {
        employeeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isPartialDay: isPartialDay || false,
        partialHours: isPartialDay ? partialHours : null,
        reason,
        status: 'PENDING',
      }
    })

    return created(res, { leave })
  } catch (err) { next(err) }
}

// GET /leaves — employee sees own, HR sees all
const listLeaves = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1')
    const pageSize = parseInt(req.query.pageSize || '10')
    const skip = (page - 1) * pageSize
    const where = req.user.role === 'EMPLOYEE' ? { employeeId: req.user.employeeId } : {}
    if (req.query.status) where.status = req.query.status

    const [leaves, total] = await Promise.all([
      prisma.leaveRequest.findMany({
        where,
        include: { employee: { select: { fullName: true, department: true } } },
        orderBy: { createdAt: 'desc' },
        skip, take: pageSize
      }),
      prisma.leaveRequest.count({ where })
    ])

    return res.json({ success: true, data: leaves, pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } })
  } catch (err) { next(err) }
}

// POST /leaves/:id/decision — HR approves/rejects
const decideLeave = async (req, res, next) => {
  try {
    const { id } = req.params
    const { decision } = req.body

    const leave = await prisma.leaveRequest.findUnique({ where: { id } })
    if (!leave) return notFound(res, 'Leave request not found')
    if (leave.status !== 'PENDING') return conflict(res, 'Leave already processed')

    const newStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'

    const updated = await prisma.$transaction(async (tx) => {
      const l = await tx.leaveRequest.update({
        where: { id },
        data: { status: newStatus, reviewedBy: req.user.id, reviewedAt: new Date() }
      })

      // Update leave balance if approved
      if (newStatus === 'APPROVED') {
        const year = leave.startDate.getFullYear()
        const days = leave.isPartialDay
          ? (leave.partialHours / 8)
          : Math.max(1, Math.ceil((leave.endDate - leave.startDate) / (1000 * 60 * 60 * 24)) + 1)

        await tx.leaveBalance.updateMany({
          where: { employeeId: leave.employeeId, year },
          data: { usedDays: { increment: days }, remainingDays: { decrement: days } }
        })
      }
      return l
    })

    await auditService.log({
      actorId: req.user.id,
      action: `LEAVE_${decision}D`,
      entityType: 'LeaveRequest',
      entityId: id,
      beforeState: { status: 'PENDING' },
      afterState: { status: newStatus }
    })

    return ok(res, { leave: updated })
  } catch (err) { next(err) }
}

// GET /leaves/balance
const getBalance = async (req, res, next) => {
  try {
    const employeeId = req.user.employeeId
    const year = new Date().getFullYear()
    const balance = await prisma.leaveBalance.findUnique({ where: { employeeId_year: { employeeId, year } } })
    return ok(res, { balance: balance || { entitledDays: 24, usedDays: 0, remainingDays: 24 } })
  } catch (err) { next(err) }
}

module.exports = { createLeave, listLeaves, decideLeave, getBalance }
