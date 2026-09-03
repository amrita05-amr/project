const { Router } = require('express')
const { body } = require('express-validator')
const { validate } = require('../../middleware/validate')
const { authenticate } = require('../../middleware/auth')
const { register, login, refresh, logout } = require('./auth.service')

const router = Router()

router.post('/register',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('fullName').trim().notEmpty().withMessage('Full name required'),
    body('phone').trim().notEmpty().withMessage('Phone required'),
    body('department').trim().notEmpty().withMessage('Department required'),
    body('employeeCode').trim().notEmpty().withMessage('Employee code required'),
  ],
  validate,
  register
)

router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  login
)

router.post('/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token required')],
  validate,
  refresh
)

router.post('/logout', authenticate, logout)

module.exports = router
