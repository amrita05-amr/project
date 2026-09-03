const { Router } = require('express')
const { body, query } = require('express-validator')
const { validate } = require('../../middleware/validate')
const { authenticate, requireHR, requireAny } = require('../../middleware/auth')
const { listEmployees, getEmployee, approveEmployee, getDashboard, getHRAttendance } = require('./employees.service')

const router = Router()
router.use(authenticate)

// HR Dashboard aggregates
router.get('/hr/dashboard', requireHR, getDashboard)
router.get('/hr/attendance', requireHR, [query('page').optional().isInt({ min: 1 })], validate, getHRAttendance)

// Employee management
router.get('/employees', requireHR, [query('page').optional().isInt({ min: 1 }), query('status').optional()], validate, listEmployees)
router.get('/employees/:id', requireAny, getEmployee)
router.post('/employees/:id/approve', requireHR,
  [body('decision').isIn(['APPROVE', 'REJECT']).withMessage('Decision must be APPROVE or REJECT')],
  validate, approveEmployee
)

module.exports = router
