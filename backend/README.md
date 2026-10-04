# CampusConnect Backend API

A lightweight, beginner-friendly REST API built with Node.js, Express.js, PostgreSQL (`pg`), JWT authentication, and bcrypt password hashing for the **CampusConnect** student team formation platform.

---

## 📋 Prerequisites & Requirements

- **Node.js**: v18.x or higher
- **PostgreSQL**: v13.x or higher
- **npm**: v9.x or higher

---

## ⚙️ PostgreSQL Setup & Database Creation

### 1. Start PostgreSQL Service
Ensure your local PostgreSQL service is running on your system:
- **Windows**: Start via Windows Services (`services.msc`), pgAdmin, or run `net start postgresql-x64-XX`.
- **macOS**: `brew services start postgresql`
- **Linux**: `sudo systemctl start postgresql`

### 2. Create the Database
Log into PostgreSQL via `psql` or pgAdmin:

```bash
psql -U postgres
```

Inside the PostgreSQL shell, create the database:

```sql
CREATE DATABASE campusconnect_db;
\q
```

---

## 🔧 Environment Configuration (`.env`)

Inside the `backend/` directory, create a `.env` file (or copy from `.env.example`):

```bash
cp .env.example .env
```

Ensure the configuration matches your environment:

```env
# Server Configuration
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

# Authentication Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# PostgreSQL Database Configuration
PGHOST=localhost
PGPORT=5432
PGDATABASE=campusconnect_db
PGUSER=postgres
PGPASSWORD=your_postgres_password
```

---

## 📦 Installation

Navigate into the `backend/` directory and install the required dependencies:

```bash
cd backend
npm install
```

---

## 🗄️ Database Initialization & Seeding

Run the automated migration and seed script to create all necessary tables (including `password_hash`), apply migrations, and seed the default student profile (`Onkar Patil` / `Password123!`) and initial team request (`KisanSetu AI`):

```bash
npm run db:init
```

---

## 🚀 Running the Backend Server

### Development Mode (with auto-reload on file changes):
```bash
npm run dev
```

### Production Mode:
```bash
npm start
```

The server will start at:
```
http://localhost:5000
```

Verify health check:
```bash
curl http://localhost:5000/api/health
```

---

## 📡 REST API Endpoints

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Description | Request Body | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new student account | `{ name, email, password, confirmPassword, college, role }` | No |
| `POST` | `/api/auth/login` | Log in with email & password | `{ email, password }` | No |
| `GET` | `/api/auth/me` | Fetch currently logged-in user profile | None | **Yes** (`Bearer <token>`) |

### 2. Team Requests (`/api/requests`)
| Method | Endpoint | Description | Query / Body | Auth Required |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/requests` | List team requests (with member rosters) | `?category=Hackathons&search=React` | No |
| `GET` | `/api/requests/:id` | Fetch single request details | None | No |
| `POST` | `/api/requests` | Publish a new team request | `{ title, category, eventName, shortDesc, fullDesc, skillsRequired, techStack, membersNeeded, experienceLevel, deadline, openRoles, requirements }` | **Yes** (`Bearer <token>`) |
| `GET` | `/api/requests/:id/applications` | List applications submitted to a team request | None | No |
| `POST` | `/api/requests/:id/applications` | Submit application to join a team | `{ roleApplied, pitch, portfolioLink, hoursCommitment }` | **Yes** (`Bearer <token>`) |

### 3. Student Profile (`/api/users`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/me` | Fetch active student profile (stats, skills, hackathons, portfolio) | No |
| `GET` | `/api/users/:id` | Fetch student profile by ID | No |

### 4. Health Check
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status | No |

---

## 🔒 How JWT Authentication Works in This Project

1. **Password Hashing**: During registration, passwords are salted and hashed using `bcryptjs` (`10` rounds). Plaintext passwords are never stored or logged.
2. **Token Generation**: Upon successful registration or login, the server generates a signed JSON Web Token containing `{ id, email }` signed with `JWT_SECRET`.
3. **Frontend Storage**: The token is stored in browser `localStorage` (`campusconnect_token`).
4. **Token Verification**: Protected endpoints pass `Authorization: Bearer <token>`. The `authenticateToken` middleware verifies the token and attaches the authenticated user to `req.user`.
5. **Protected Frontend Actions**:
   - Posting a team request (`CreateRequestModal`) requires login.
   - Applying to a team (`ApplyModal`) requires login.
   - Viewing personal profile requires login.
   - If an unauthenticated student clicks these actions, the `AuthModal` opens automatically, preserving their intended destination/action upon signing in.
