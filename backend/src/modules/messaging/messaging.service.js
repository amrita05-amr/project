const prisma = require('../../lib/prisma')
const { ok, created } = require('../../lib/response')

// POST /messages
const sendMessage = async (req, res, next) => {
  try {
    const { recipientId, body } = req.body
    const msg = await prisma.message.create({
      data: { senderId: req.user.id, recipientId, body }
    })
    return created(res, { message: msg })
  } catch (err) { next(err) }
}

// GET /messages/thread/:userId — conversation between logged-in user and another user
const getThread = async (req, res, next) => {
  try {
    const { userId } = req.params
    const myId = req.user.id
    const page = parseInt(req.query.page || '1')
    const pageSize = parseInt(req.query.pageSize || '30')
    const skip = (page - 1) * pageSize

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: {
          OR: [
            { senderId: myId, recipientId: userId },
            { senderId: userId, recipientId: myId }
          ]
        },
        orderBy: { sentAt: 'desc' },
        skip, take: pageSize,
        include: { sender: { select: { id: true } } }
      }),
      prisma.message.count({
        where: {
          OR: [
            { senderId: myId, recipientId: userId },
            { senderId: userId, recipientId: myId }
          ]
        }
      })
    ])

    // Mark as read
    await prisma.message.updateMany({
      where: { recipientId: myId, senderId: userId, readAt: null },
      data: { readAt: new Date() }
    })

    return res.json({ success: true, data: messages.reverse(), pagination: { total, page, pageSize } })
  } catch (err) { next(err) }
}

// GET /messages/inbox — all unread message summaries
const getInbox = async (req, res, next) => {
  try {
    const unread = await prisma.message.findMany({
      where: { recipientId: req.user.id, readAt: null },
      orderBy: { sentAt: 'desc' },
      include: { sender: { select: { id: true, email: true, employee: { select: { fullName: true, department: true } } } } }
    })
    return ok(res, { unreadCount: unread.length, messages: unread })
  } catch (err) { next(err) }
}

// GET /messages/contacts — list available users to chat with
const getContacts = async (req, res, next) => {
  try {
    const isHR = req.user.role === 'HR_ADMIN'
    let contacts = []

    if (isHR) {
      // HR can chat with all active employees
      const users = await prisma.user.findMany({
        where: { role: 'EMPLOYEE', isActive: true },
        select: {
          id: true,
          email: true,
          role: true,
          employee: {
            select: {
              fullName: true,
              department: true,
              employeeCode: true
            }
          }
        }
      })
      contacts = users.map(u => ({
        id: u.id,
        name: u.employee?.fullName || u.email.split('@')[0],
        email: u.email,
        department: u.employee?.department || 'Operations',
        role: 'Employee',
        code: u.employee?.employeeCode || 'EMP'
      }))
    } else {
      // Employee can chat with HR Admins
      const hrs = await prisma.user.findMany({
        where: { role: 'HR_ADMIN', isActive: true },
        select: { id: true, email: true, role: true }
      })
      contacts = hrs.map(h => ({
        id: h.id,
        name: h.email.startsWith('hr') ? 'HR Support & Operations' : h.email.split('@')[0],
        email: h.email,
        department: 'Human Resources',
        role: 'HR Admin'
      }))
    }

    return ok(res, { contacts })
  } catch (err) { next(err) }
}

module.exports = { sendMessage, getThread, getInbox, getContacts }

