const { Router } = require('express')
const { body, query } = require('express-validator')
const { validate } = require('../../middleware/validate')
const { authenticate, requireEmployee, requireHR, requireAny } = require('../../middleware/auth')
const { createLeave, listLeaves, decideLeave, getBalance } = require('./leave.service')

const router = Router()
router.use(authenticate)

router.post('/', requireEmployee,
  [
    body('startDate').isISO8601().withMessage('Valid start date required'),
    body('endDate').isISO8601().withMessage('Valid end date required'),
    body('isPartialDay').optional().isBoolean(),
    body('partialHours').optional().isFloat({ min: 0.5, max: 7.5 }),
    body('reason').optional().isString(),
  ],
  validate, createLeave
)

router.get('/', requireAny, [query('status').optional(), query('page').optional().isInt({ min: 1 })], validate, listLeaves)

router.get('/balance', requireEmployee, getBalance)

router.post('/:id/decision', requireHR,
  [body('decision').isIn(['APPROVE', 'REJECT']).withMessage('Decision must be APPROVE or REJECT')],
  validate, decideLeave
)

module.exports = router
