const cron = require('node-cron')
const prisma = require('../../lib/prisma')
const { computeShortfall } = require('../workingHours/workingHours.service')

/**
 * Runs daily at 23:59:00 — auto-closes any still-active sessions,
 * marks unchecked employees as ABSENT, and creates deductions.
 */
function startScheduler() {
  const autoCloseHour = process.env.AUTO_CLOSE_HOUR || '23'
  const autoCloseMin  = process.env.AUTO_CLOSE_MINUTE || '59'

  cron.schedule(`${autoCloseMin} ${autoCloseHour} * * *`, async () => {
    const now = new Date()
    const today = new Date(now.toDateString())
    console.log(`[Scheduler] Running nightly auto-close at ${now.toISOString()}`)

    try {
      // 1. Close all still-active sessions
      const activeSessions = await prisma.attendanceSession.findMany({
        where: { status: 'ACTIVE' },
        include: { employee: { include: { workSchedule: true } } }
      })

      for (const session of activeSessions) {
        const computedHours = Math.round((now - new Date(session.checkInAt)) / 1000 / 3600 * 100) / 100

        await prisma.$transaction(async (tx) => {
          await tx.attendanceSession.update({
            where: { id: session.id },
            data: { checkOutAt: now, status: 'AUTO_CLOSED', computedHours }
          })
          await tx.attendance.updateMany({
            where: { employeeId: session.employeeId, date: today },
            data: { status: 'AUTO_CLOSED', totalHours: { increment: computedHours }, isFinalized: true }
          })

          // Check for short-hours deduction
          const expected = session.employee.workSchedule?.expectedDailyHours ?? 8
          const grace = session.employee.workSchedule?.gracePeriodHours ?? 0.5
          const shortfall = computeShortfall(expected, computedHours, grace)
          if (shortfall > 0) {
            await tx.deduction.create({
              data: {
                employeeId: session.employeeId,
                periodStart: today, periodEnd: today,
                type: 'SHORT_HOURS',
                amountUnits: shortfall,
                ruleApplied: `Expected ${expected}h, worked ${computedHours}h, shortfall ${shortfall}h`
              }
            })
          }
        })
        console.log(`[Scheduler] Auto-closed session ${session.id} (${session.employee.fullName}) — ${computedHours}h`)
      }

      // 2. Mark employees with no attendance record today as ABSENT
      const approvedEmployees = await prisma.employee.findMany({ where: { registrationStatus: 'APPROVED' } })
      for (const emp of approvedEmployees) {
        const record = await prisma.attendance.findUnique({
          where: { employeeId_date: { employeeId: emp.id, date: today } }
        })
        if (!record) {
          await prisma.attendance.create({
            data: { employeeId: emp.id, date: today, status: 'ABSENT', totalHours: 0, isFinalized: true }
          })
        } else if (!record.isFinalized) {
          await prisma.attendance.update({ where: { id: record.id }, data: { isFinalized: true } })
        }
      }

      console.log(`[Scheduler] Nightly auto-close complete — processed ${activeSessions.length} sessions, ${approvedEmployees.length} employees`)
    } catch (err) {
      console.error('[Scheduler] Auto-close error:', err)
    }
  })

  // Location record cleanup — runs weekly on Sunday at 02:00
  cron.schedule('0 2 * * 0', async () => {
    const retentionDays = parseInt(process.env.LOCATION_RETENTION_DAYS || '90')
    const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
    const { count } = await prisma.locationRecord.deleteMany({ where: { recordedAt: { lt: cutoff } } })
    console.log(`[Scheduler] Location cleanup: deleted ${count} records older than ${retentionDays} days`)
  })

  console.log('[Scheduler] Jobs registered')
}

module.exports = { startScheduler }
