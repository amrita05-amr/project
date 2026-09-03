// Server-side working hours calculation — never trusts client-submitted values

/**
 * Compute hours between two timestamps minus any off-duty intervals
 * @param {Date} checkInAt
 * @param {Date} checkOutAt
 * @param {Array<{offAt: Date, onAt: Date}>} breaks
 * @returns {number} hours worked (rounded to 2 decimal places)
 */
function computeSessionHours(checkInAt, checkOutAt, breaks = []) {
  const totalMs = new Date(checkOutAt) - new Date(checkInAt)
  const breakMs = breaks.reduce((sum, b) => {
    if (b.offAt && b.onAt) return sum + (new Date(b.onAt) - new Date(b.offAt))
    return sum
  }, 0)
  const workedMs = Math.max(0, totalMs - breakMs)
  return Math.round((workedMs / 1000 / 3600) * 100) / 100
}

/**
 * Aggregate weekly hours from a list of Attendance daily records
 */
function computeWeeklyHours(attendances) {
  return Math.round(attendances.reduce((sum, a) => sum + (a.totalHours || 0), 0) * 100) / 100
}

/**
 * Compute shortfall deduction
 * @param {number} expectedHours
 * @param {number} actualHours
 * @param {number} gracePeriodHours
 * @returns {number} shortfall hours (0 if within grace)
 */
function computeShortfall(expectedHours, actualHours, gracePeriodHours = 0.5) {
  const shortfall = expectedHours - actualHours
  return shortfall > gracePeriodHours ? Math.round(shortfall * 100) / 100 : 0
}

module.exports = { computeSessionHours, computeWeeklyHours, computeShortfall }
