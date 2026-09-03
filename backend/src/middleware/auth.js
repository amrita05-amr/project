const jwt = require('jsonwebtoken')
const { unauthorized, forbidden } = require('../lib/response')
const prisma = require('../lib/prisma')

// ─── Authenticate JWT ─────────────────────────────────────────────────────────
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'Access token required')
    }

    const token = authHeader.split(' ')[1]
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET)

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { employee: true },
    })

    if (!user || !user.isActive) {
      return unauthorized(res, 'Account not found or inactive')
    }

    req.user = {
      id: user.id,
      role: user.role,
      employee: user.employee,
      employeeId: user.employee?.id || null,
    }

    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return unauthorized(res, 'Token expired')
    if (err.name === 'JsonWebTokenError') return unauthorized(res, 'Invalid token')
    next(err)
  }
}

// ─── Require Role ─────────────────────────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return unauthorized(res)
  if (!roles.includes(req.user.role)) return forbidden(res, 'Insufficient permissions')
  next()
}

const requireHR    = requireRole('HR_ADMIN')
const requireEmployee = requireRole('EMPLOYEE')
const requireAny   = requireRole('EMPLOYEE', 'HR_ADMIN')

module.exports = { authenticate, requireRole, requireHR, requireEmployee, requireAny }
