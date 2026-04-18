<<<<<<< HEAD
# 🎯 AI Productivity Coach — Webapp v2.0

A full-stack productivity app with JWT authentication, task management, habit tracking, and a rule-based AI coaching engine.

---

## 🗂 Project Structure

```
webapp/
├── backend/
│   ├── config/
│   │   └── db.js                  # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js      # Register / Login / Profile
│   │   ├── taskController.js      # Full task CRUD
│   │   ├── habitController.js     # Full habit CRUD + check-in
│   │   └── statsController.js     # Analytics endpoint
│   ├── middleware/
│   │   ├── auth.js                # JWT bearer guard
│   │   └── validate.js            # Request body validation
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── habitRoutes.js
│   │   └── statsRoutes.js
│   ├── database.sql               # Full schema + views
│   ├── server.js
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx                # Full React SPA
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 🗄 Database Schema

| Table                | Key Columns |
|----------------------|-------------|
| `users`              | id, name, email, password_hash, created_at |
| `tasks`              | id, title, description, deadline, **priority**, is_completed, completed_at, user_id |
| `habits`             | id, name, **category**, streak, **longest_streak**, last_updated, user_id |
| `habit_logs`         | id, habit_id, user_id, checked_in_date *(audit log)* |
| `ai_suggestions_log` | id, user_id, suggestion_text, suggestion_type |
| `user_stats` *(view)*| Aggregated counts per user |

---

## 📡 REST API Reference

All protected routes require: `Authorization: Bearer <token>`

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | — | Create account → returns token |
| POST | `/login` | — | Sign in → returns token |
| GET  | `/me` | 🔒 | Get current user profile |
| PUT  | `/me` | 🔒 | Update display name |

### Tasks — `/api/tasks`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | `/` | 🔒 | List tasks (`?completed=true&priority=high`) |
| GET    | `/:id` | 🔒 | Get single task |
| POST   | `/` | 🔒 | Create task (`title`, `description`, `deadline`, `priority`) |
| PUT    | `/:id` | 🔒 | Edit task fields |
| PATCH  | `/:id/complete` | 🔒 | Toggle done / undone |
| DELETE | `/:id` | 🔒 | Delete task |

### Habits — `/api/habits`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | `/` | 🔒 | List habits (`?category=health`) |
| GET    | `/:id` | 🔒 | Get single habit |
| POST   | `/` | 🔒 | Create habit (`name`, `category`) |
| PUT    | `/:id` | 🔒 | Rename / recategorize |
| PATCH  | `/:id/checkin` | 🔒 | Daily check-in (updates streak) |
| DELETE | `/:id` | 🔒 | Delete habit |

### Stats — `/api/stats`
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET    | `/` | 🔒 | Task breakdown, habit analytics, weekly history |

---

## 🚀 Quick Start

### Option A — Docker (recommended)

```bash
# 1. Copy and configure environment
cp backend/.env.example backend/.env
# Edit backend/.env: set DB_PASSWORD and JWT_SECRET

# 2. Start everything
docker compose up --build

# Frontend: http://localhost
# API:      http://localhost:3000/api
```

### Option B — Local Development

**Backend:**
```bash
cd backend
cp .env.example .env   # fill in DB credentials & JWT_SECRET
npm install
# Make sure MySQL is running and the database.sql has been imported:
# mysql -u root -p < database.sql
npm run dev            # starts on http://localhost:3000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev            # starts on http://localhost:5173
```

---

## 🔐 Security Notes

- Passwords are hashed with **bcryptjs** (salt rounds: 10)
- JWT tokens expire after **7 days** (configurable via `JWT_EXPIRES`)
- Auth endpoints are rate-limited to **20 requests / 15 minutes**
- All other endpoints limited to **200 requests / 15 minutes**
- Always set a strong `JWT_SECRET` before deploying — never use the default

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, plain CSS-in-JS |
| Backend | Node.js, Express 4 |
| Auth | JSON Web Tokens (jsonwebtoken) + bcryptjs |
| Database | MySQL 8 (mysql2 driver) |
| Container | Docker + Docker Compose |
| Web server | Nginx (serves built React app) |

---

## 📦 Backend Dependencies

```json
"bcryptjs":           "^2.4.3",
"cors":               "^2.8.5",
"dotenv":             "^16.3.1",
"express":            "^4.18.2",
"express-rate-limit": "^7.1.5",
"jsonwebtoken":       "^9.0.2",
"mysql2":             "^3.6.0"
```
=======
# AIProductivityCoach-webapp
>>>>>>> fbe9831d317483a60e6d779f37124a5bcfd256ac
