// Mock data for Phase 1 (replaced with real API in Phase 3)

export const mockEmployees = [
  { id: '1', name: 'Aarav Sharma', department: 'Engineering', role: 'Senior Developer', status: 'WORKING', checkIn: '09:02 AM', checkOut: null, hours: 6.5, location: 'Mumbai, IN', avatar: 'AS' },
  { id: '2', name: 'Priya Nair',   department: 'Design',      role: 'UI/UX Lead',       status: 'WORKING', checkIn: '09:15 AM', checkOut: null, hours: 6.2, location: 'Bangalore, IN', avatar: 'PN' },
  { id: '3', name: 'Rohan Gupta',  department: 'Marketing',   role: 'Marketing Head',   status: 'ABSENT',  checkIn: null,       checkOut: null, hours: 0,   location: null, avatar: 'RG' },
  { id: '4', name: 'Sneha Patel',  department: 'Engineering', role: 'Backend Engineer', status: 'ON_LEAVE', checkIn: null,      checkOut: null, hours: 0,   location: null, avatar: 'SP' },
  { id: '5', name: 'Karan Mehta',  department: 'Sales',       role: 'Sales Manager',    status: 'WORKING', checkIn: '08:55 AM', checkOut: null, hours: 6.8, location: 'Delhi, IN', avatar: 'KM' },
  { id: '6', name: 'Anjali Singh', department: 'HR',          role: 'HR Executive',     status: 'CHECKED_OUT', checkIn: '09:00 AM', checkOut: '05:30 PM', hours: 8.2, location: 'Mumbai, IN', avatar: 'AS' },
  { id: '7', name: 'Vikram Rao',   department: 'Finance',     role: 'Finance Analyst',  status: 'ON_BREAK', checkIn: '09:10 AM', checkOut: null, hours: 5.1, location: 'Pune, IN', avatar: 'VR' },
  { id: '8', name: 'Meera Iyer',   department: 'Engineering', role: 'DevOps Engineer',  status: 'WORKING', checkIn: '08:45 AM', checkOut: null, hours: 7.0, location: 'Chennai, IN', avatar: 'MI' },
]

export const mockPendingApprovals = [
  { id: 'p1', name: 'Rahul Desai',  email: 'rahul.desai@company.com',  department: 'Engineering', code: 'EMP-2026-009', submittedAt: '2026-09-03 10:20 AM' },
  { id: 'p2', name: 'Fatima Khan',  email: 'fatima.khan@company.com',  department: 'Design',      code: 'EMP-2026-010', submittedAt: '2026-09-03 09:45 AM' },
  { id: 'p3', name: 'Arjun Reddy',  email: 'arjun.reddy@company.com',  department: 'Finance',     code: 'EMP-2026-011', submittedAt: '2026-09-02 04:10 PM' },
]

export const mockAttendanceHistory = [
  { date: '2026-09-03', status: 'WORKING',     hours: 6.5,  checkIn: '09:02 AM', checkOut: null },
  { date: '2026-09-02', status: 'CHECKED_OUT', hours: 8.5,  checkIn: '09:00 AM', checkOut: '05:30 PM' },
  { date: '2026-09-01', status: 'CHECKED_OUT', hours: 7.8,  checkIn: '09:15 AM', checkOut: '05:03 PM' },
  { date: '2026-08-30', status: 'ABSENT',      hours: 0,    checkIn: null,       checkOut: null },
  { date: '2026-08-29', status: 'CHECKED_OUT', hours: 8.2,  checkIn: '08:58 AM', checkOut: '05:09 PM' },
  { date: '2026-08-28', status: 'ON_LEAVE',    hours: 0,    checkIn: null,       checkOut: null },
  { date: '2026-08-27', status: 'CHECKED_OUT', hours: 8.0,  checkIn: '09:00 AM', checkOut: '05:00 PM' },
]

export const mockMessages = [
  { id: 'm1', sender: 'HR', body: 'Hi! Your attendance record for August looks great. Keep it up!', sentAt: '2:30 PM', isOwn: false },
  { id: 'm2', sender: 'Me', body: 'Thank you! Will continue to maintain the same.', sentAt: '2:32 PM', isOwn: true },
  { id: 'm3', sender: 'HR', body: 'Please ensure you submit your leave request for next week via the portal.', sentAt: '3:15 PM', isOwn: false },
  { id: 'm4', sender: 'Me', body: 'Sure, I will do that today itself.', sentAt: '3:18 PM', isOwn: true },
]

export const mockDashboardStats = {
  total: 48,
  present: 31,
  absent: 6,
  onLeave: 5,
  working: 28,
  onBreak: 3,
  pendingApprovals: 3,
}

export const mockWeeklyHours = [
  { day: 'Mon', hours: 8.5 },
  { day: 'Tue', hours: 7.8 },
  { day: 'Wed', hours: 8.2 },
  { day: 'Thu', hours: 8.0 },
  { day: 'Fri', hours: 6.5 },
]

export const mockLeaveBalance = {
  entitled: 24,
  used: 6,
  remaining: 18,
}

export const mockCurrentUser = {
  id: 'emp-001',
  name: 'Aarav Sharma',
  email: 'aarav.sharma@company.com',
  role: 'EMPLOYEE',
  department: 'Engineering',
  employeeCode: 'EMP-2026-001',
  avatar: 'AS',
}

export const mockHRUser = {
  id: 'hr-001',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@company.com',
  role: 'HR_ADMIN',
  department: 'Human Resources',
  avatar: 'SJ',
}
