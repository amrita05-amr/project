const { Router } = require('express')
const { body, query } = require('express-validator')
const { validate } = require('../../middleware/validate')
const { authenticate, requireEmployee } = require('../../middleware/auth')
const { checkIn, checkOut, toggleDuty, getMyStatus, getHistory } = require('./attendance.service')

const router = Router()
router.use(authenticate)

router.post('/check-in',
  requireEmployee,
  [
    body('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
    body('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  ],
  validate, checkIn
)

router.post('/check-out', requireEmployee,
  [body('sessionId').optional().isUUID()],
  validate, checkOut
)

router.post('/duty', requireEmployee,
  [body('state').isIn(['ON', 'OFF']).withMessage('State must be ON or OFF')],
  validate, toggleDuty
)

router.get('/me', requireEmployee, getMyStatus)

router.get('/history', requireEmployee,
  [
    query('page').optional().isInt({ min: 1 }),
    query('pageSize').optional().isInt({ min: 1, max: 100 }),
  ],
  validate, getHistory
)

module.exports = router
