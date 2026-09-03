require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

const authRouter      = require('./modules/auth/auth.router')
const attendanceRouter = require('./modules/attendance/attendance.router')
const locationRouter  = require('./modules/location/location.router')
const employeesRouter = require('./modules/employees/employees.router')
const leaveRouter     = require('./modules/leave/leave.router')
const messagingRouter = require('./modules/messaging/messaging.router')
const { listAuditLogs } = require('./modules/audit/audit.service')
const { authenticate, requireHR } = require('./middleware/auth')
const { startScheduler } = require('./modules/scheduler/scheduler')
const prisma = require('./lib/prisma')

const app = express()

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many requests' } })
const apiLimiter  = rateLimit({ windowMs: 60 * 1000,       max: 200 })

// ─── Health Check (Unauthenticated) ──────────────────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ success: true, status: 'healthy', database: 'connected', timestamp: new Date().toISOString() })
  } catch (err) {
    res.status(503).json({ success: false, status: 'unhealthy', error: err.message })
  }
})

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',       authLimiter, authRouter)
app.use('/api/attendance', apiLimiter,  attendanceRouter)
app.use('/api/location',   apiLimiter,  locationRouter)
app.use('/api',            apiLimiter,  employeesRouter)  // /api/employees, /api/hr/*
app.use('/api/leaves',     apiLimiter,  leaveRouter)
app.use('/api/messages',   apiLimiter,  messagingRouter)

// Audit log route
app.get('/api/audit', authenticate, requireHR, listAuditLogs)

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err)
  if (err.code === 'P2002') {
    return res.status(409).json({ success: false, message: 'Duplicate record — unique constraint violation', field: err.meta?.target })
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, message: 'Record not found' })
  }
  res.status(err.statusCode || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  })
})

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` })
})

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001
app.listen(PORT, async () => {
  console.log(`\n🚀 EAMS API running at http://localhost:${PORT}`)
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`   Health:      http://localhost:${PORT}/api/health\n`)
  startScheduler()
})

module.exports = app
