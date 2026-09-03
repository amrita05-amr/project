# 🧠 Brain.md — Employee Attendance Management System (EAMS)

> Single Source of Truth for architecture, decisions, schema, API contracts, and development progress.

---

## 📋 Project Overview

| Field | Details |
|---|---|
| **Project Name** | AttendTrack — Employee Attendance Management System (EAMS) |
| **Specification** | [`Employee_Attendance_Management_System_HLD.md`](file:///Users/swastik/employee%20attendence%20/Employee_Attendance_Management_System_HLD.md) |
| **Status** | 🟢 **Phase 1, 2 & 3 Complete** — Awaiting Docker Desktop to launch DB |
| **Frontend URL** | [http://localhost:5173](http://localhost:5173) (Active) |
| **Backend Port** | `3001` (API Base: `http://localhost:3001/api`) |
| **Database** | PostgreSQL 16 (via Docker) |
| **Cache/Queue** | Redis 7 (via Docker) |

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Frontend** | React 19 + Vite | Ultra-fast HMR and bundle compilation (<600ms build) |
| **Styling** | Custom Vanilla CSS Design System | Curated warm ivory palette, frosted glassmorphism, subtle micro-animations, zero bulky CSS frameworks |
| **Icons** | `lucide-react` | Crisp, scalable icon library for enterprise dashboards |
| **Routing** | `react-router-dom` v7 | Protected route wrappers with Role-Based Access Control (RBAC) |
| **Backend API** | Node.js + Express (Modular Monolith) | Robust modular architecture, clean separation of concerns |
| **ORM** | Prisma 5.18.0 | Strong schema typing, automatic migrations, relationship integrity |
| **Security** | Helmet, CORS, Express Rate Limit, Bcryptjs | Enterprise-grade HTTP headers, rate limiting, and password hashing (12 rounds) |
| **Auth** | JWT (15-min Access Token + 7-day Refresh Token Rotation) | Secure stateless authentication with automatic refresh queue in Axios |
| **Scheduling** | `node-cron` | 23:59 nightly auto-close of active sessions, ABSENT marking, shortfall deduction |
| **Containerization**| Docker Compose | Multi-container setup with isolated volumes & health checks |

---

## 🗄️ Database Entities (13 Entities as specified in HLD)

1. **`User`**: Core authentication credential store (email, password hash, role, status).
2. **`Employee`**: Profile data, employee code, department, registration approval status, approver relation.
3. **`WorkSchedule`**: Working days mask, expected hours (8h/day, 40h/week), grace periods.
4. **`AttendanceSession`**: Active/closed check-in session with GPS coordinates, duty state (`ON`/`OFF`), idempotency key.
5. **`Attendance`**: Daily rollup table with date unique constraint per employee, status, total hours, finalized flag.
6. **`LocationRecord`**: High-precision GPS breadcrumbs (source: `CHECK_IN`, `HEARTBEAT`, `CHECK_OUT`).
7. **`LeaveBalance`**: Annual entitlement tracking (entitled, used, remaining days).
8. **`LeaveRequest`**: Partial-day or multi-day requests with approval flow and automatic balance deduction.
9. **`Deduction`**: Shortfall hour deductions calculated strictly server-side based on work schedule grace periods.
10. **`Message`**: Direct two-way messaging between employees and HR with read receipts.
11. **`LocationRequest`**: On-demand location pings initiated by HR admins.
12. **`Notification`**: Multi-channel notifications (In-app, queued).
13. **`AuditLog`**: Tamper-evident ledger recording all state mutations and decisions.
14. **`RefreshToken`**: Stored cryptographic refresh tokens with rotation and revocation.

---

## 🔌 API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /register` — Register new employee (sets status to `PENDING`)
- `POST /login` — Login with email/password, returns tokens + user object
- `POST /refresh` — Rotate refresh token and issue new access token
- `POST /logout` — Revoke active refresh token

### Attendance (`/api/attendance`)
- `POST /check-in` — Check in with GPS coordinates and idempotency key
- `POST /check-out` — Check out of active session, compute hours server-side
- `POST /duty` — Toggle duty state (`ON` / `OFF`) for break tracking
- `GET /me` — Current employee real-time session and daily attendance status
- `GET /history` — Paginated attendance history for the logged-in employee

### Location (`/api/location`)
- `POST /update` — 30-minute periodic heartbeat (only recorded if duty is `ON`)
- `GET /latest` — Latest known coordinate per employee with stale flag (>45 min)

### HR Administration (`/api`)
- `GET /hr/dashboard` — Live employee counts (Total, Present, Working, Break, Absent, Leave)
- `GET /hr/attendance` — Paginated company-wide attendance records
- `GET /employees` — Paginated employee directory filtered by approval status
- `POST /employees/:id/approve` — Approve or reject employee registration
- `GET /audit` — Paginated system audit log

### Leaves & Messaging (`/api/leaves`, `/api/messages`)
- `POST /leaves` & `GET /leaves` — Submit and view leave applications
- `GET /leaves/balance` — Current leave balance entitlement
- `POST /leaves/:id/decision` — HR decision (`APPROVE`/`REJECT`) with auto balance update
- `POST /messages` & `GET /messages/thread/:userId` — Threaded messaging

---

## 🚀 Running the Full Stack

### 1. Start the Database (PostgreSQL & Redis)
Once Docker Desktop is opened on your Mac:
```bash
docker compose up -d
```

### 2. Push Prisma Schema & Seed Database
```bash
cd backend
npx prisma db push
node src/lib/seed.js
```

### 3. Start the Backend API
```bash
npm run dev
```

### 4. Open the Frontend
```
http://localhost:5173
```
- **Employee Login:** `employee@company.com` (or seeded `aarav@company.com` / `Employee@1234`)
- **HR Admin Login:** `hr@company.com` (or seeded `hr@company.com` / `Admin@1234`)
