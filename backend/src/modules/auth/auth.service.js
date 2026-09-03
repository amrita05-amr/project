const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')
const prisma = require('../../lib/prisma')
const { created, ok, unauthorized, conflict, forbidden, badRequest, noContent } = require('../../lib/response')

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12')
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m'
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

function signAccess(userId, role) {
  return jwt.sign({ userId, role }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES })
}

function signRefresh(userId) {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES })
}

// POST /auth/register
const register = async (req, res, next) => {
  try {
    const { email, password, fullName, phone, department, employeeCode } = req.body

    // Check uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) return conflict(res, 'Email already registered')

    const existingEmp = await prisma.employee.findUnique({ where: { employeeCode } })
    if (existingEmp) return conflict(res, 'Employee code already taken')

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)

    // Default work schedule
    let schedule = await prisma.workSchedule.findFirst()
    if (!schedule) {
      schedule = await prisma.workSchedule.create({
        data: { name: 'Standard 9-6', expectedDailyHours: 8, expectedWeeklyHours: 40 }
      })
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'EMPLOYEE',
        employee: {
          create: {
            fullName,
            phone,
            department,
            employeeCode,
            workScheduleId: schedule.id,
            registrationStatus: 'PENDING',
          }
        }
      },
      include: { employee: true }
    })

    return created(res, {
      message: 'Registration submitted. Awaiting HR approval.',
      status: 'PENDING',
      employeeCode: user.employee.employeeCode,
    })
  } catch (err) { next(err) }
}

// POST /auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    const user = await prisma.user.findUnique({
      where: { email },
      include: { employee: true }
    })

    if (!user) return unauthorized(res, 'Invalid email or password')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return unauthorized(res, 'Invalid email or password')

    if (!user.isActive) return forbidden(res, 'Account deactivated')

    // Check approval for employees
    if (user.role === 'EMPLOYEE') {
      if (user.employee?.registrationStatus === 'PENDING')
        return forbidden(res, 'Account pending HR approval')
      if (user.employee?.registrationStatus === 'REJECTED')
        return forbidden(res, 'Account registration was rejected')
    }

    const accessToken  = signAccess(user.id, user.role)
    const refreshToken = signRefresh(user.id)

    // Persist refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt } })

    return ok(res, {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.employee?.fullName || 'HR Admin',
        department: user.employee?.department || 'HR',
        employeeCode: user.employee?.employeeCode,
        employeeId: user.employee?.id,
        avatar: (user.employee?.fullName || 'HA').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      }
    })
  } catch (err) { next(err) }
}

// POST /auth/refresh
const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return unauthorized(res, 'Refresh token required')

    let payload
    try { payload = jwt.verify(refreshToken, REFRESH_SECRET) }
    catch { return unauthorized(res, 'Invalid or expired refresh token') }

    // Check token is stored (not revoked)
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.refreshToken.delete({ where: { token: refreshToken } })
      return unauthorized(res, 'Refresh token revoked or expired')
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user || !user.isActive) return unauthorized(res)

    // Rotate: delete old, issue new
    const [newAccess, newRefresh] = [signAccess(user.id, user.role), signRefresh(user.id)]
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { token: refreshToken } }),
      prisma.refreshToken.create({ data: { userId: user.id, token: newRefresh, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } }),
    ])

    return ok(res, { accessToken: newAccess, refreshToken: newRefresh })
  } catch (err) { next(err) }
}

// POST /auth/logout
const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    }
    return noContent(res)
  } catch (err) { next(err) }
}

module.exports = { register, login, refresh, logout }
