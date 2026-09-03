const prisma = require('../../lib/prisma')

// Append an audit trail record
const log = async ({ actorId, action, entityType, entityId, beforeState = null, afterState = null }) => {
  try {
    await prisma.auditLog.create({
      data: { actorId, action, entityType, entityId, beforeState, afterState }
    })
  } catch (err) {
    // Audit logging should never break the main flow
    console.error('[AuditLog] Failed to write:', err.message)
  }
}

// GET /audit — HR view of audit logs
const listAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1')
    const pageSize = parseInt(req.query.pageSize || '20')
    const skip = (page - 1) * pageSize
    const where = {}
    if (req.query.entityType) where.entityType = req.query.entityType
    if (req.query.actorId)    where.actorId    = req.query.actorId

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip, take: pageSize
      }),
      prisma.auditLog.count({ where })
    ])

    return res.json({ success: true, data: logs, pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) } })
  } catch (err) { next(err) }
}

module.exports = { log, listAuditLogs }
