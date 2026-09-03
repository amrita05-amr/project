const { Router } = require('express')
const { body } = require('express-validator')
const { validate } = require('../../middleware/validate')
const { authenticate, requireEmployee, requireHR } = require('../../middleware/auth')
const { updateLocation, getLatestLocations } = require('./location.service')

const router = Router()
router.use(authenticate)

router.post('/update', requireEmployee,
  [
    body('sessionId').isUUID().withMessage('Valid session ID required'),
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
    body('accuracy').optional().isFloat({ min: 0 }),
  ],
  validate, updateLocation
)

router.get('/latest', requireHR, getLatestLocations)

module.exports = router
