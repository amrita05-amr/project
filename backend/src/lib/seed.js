const bcrypt = require('bcryptjs')
const prisma = require('./prisma')

async function seed() {
  console.log('🌱 Seeding database...')

  // Default work schedule
  const schedule = await prisma.workSchedule.upsert({
    where: { id: 'default-schedule' },
    update: {},
    create: {
      id: 'default-schedule',
      name: 'Standard 9-6',
      expectedDailyHours: 8,
      expectedWeeklyHours: 40,
      workingDaysMask: '1111100',
      gracePeriodMinutes: 15,
      gracePeriodHours: 0.5,
    }
  })
  console.log('✅ Work schedule created')

  // HR Admin user
  const hrHash = await bcrypt.hash('Admin@1234', 12)
  const hrUser = await prisma.user.upsert({
    where: { email: 'hr@company.com' },
    update: {},
    create: {
      email: 'hr@company.com',
      passwordHash: hrHash,
      role: 'HR_ADMIN',
      isActive: true,
    }
  })
  console.log('✅ HR Admin created: hr@company.com / Admin@1234')

  // Employee user (pre-approved)
  const empHash = await bcrypt.hash('Employee@1234', 12)
  const empUser = await prisma.user.upsert({
    where: { email: 'aarav@company.com' },
    update: {},
    create: {
      email: 'aarav@company.com',
      passwordHash: empHash,
      role: 'EMPLOYEE',
      isActive: true,
      employee: {
        create: {
          fullName: 'Aarav Sharma',
          department: 'Engineering',
          phone: '+91 98765 43210',
          employeeCode: 'EMP-2026-001',
          workScheduleId: schedule.id,
          registrationStatus: 'APPROVED',
          approvedBy: hrUser.id,
          approvedAt: new Date(),
        }
      }
    },
    include: { employee: true }
  })
  console.log('✅ Employee created: aarav@company.com / Employee@1234')

  // Leave balance for employee
  if (empUser.employee) {
    await prisma.leaveBalance.upsert({
      where: { employeeId_year: { employeeId: empUser.employee.id, year: new Date().getFullYear() } },
      update: {},
      create: {
        employeeId: empUser.employee.id,
        year: new Date().getFullYear(),
        entitledDays: 24,
        usedDays: 6,
        remainingDays: 18,
      }
    })
    console.log('✅ Leave balance seeded')
  }

  console.log('\n🎉 Seed complete!')
  console.log('   HR:       hr@company.com / Admin@1234')
  console.log('   Employee: aarav@company.com / Employee@1234')
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
