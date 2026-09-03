const { Router } = require('express')
const { body } = require('express-validator')
const { validate } = require('../../middleware/validate')
const { authenticate, requireAny } = require('../../middleware/auth')
const { sendMessage, getThread, getInbox, getContacts } = require('./messaging.service')

const router = Router()
router.use(authenticate, requireAny)

router.post('/', [body('recipientId').isUUID(), body('body').trim().notEmpty()], validate, sendMessage)
router.get('/inbox', getInbox)
router.get('/contacts', getContacts)
router.get('/thread/:userId', getThread)

module.exports = router
