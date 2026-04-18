// server.js — AI Productivity Coach Backend v2.0
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes  = require('./routes/authRoutes');
const taskRoutes  = require('./routes/taskRoutes');
const habitRoutes = require('./routes/habitRoutes');
const statsRoutes = require('./routes/statsRoutes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Rate Limiting ────────────────────────────────────────────────────────────
// General: 200 req / 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false
});
// Auth endpoints: tighter limit to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many attempts — please try again later' }
});
app.use(globalLimiter);

// ── Core Middleware ──────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',   authLimiter, authRoutes);
app.use('/api/tasks',               taskRoutes);
app.use('/api/habits',              habitRoutes);
app.use('/api/stats',               statsRoutes);

// ── Health / API Manifest ────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'AI Productivity Coach API',
    version: '2.0.0',
    endpoints: {
      auth: [
        'POST   /api/auth/register',
        'POST   /api/auth/login',
        'GET    /api/auth/me      (🔒)',
        'PUT    /api/auth/me      (🔒)'
      ],
      tasks: [
        'GET    /api/tasks              (🔒) ?completed=true&priority=high',
        'GET    /api/tasks/:id          (🔒)',
        'POST   /api/tasks              (🔒)',
        'PUT    /api/tasks/:id          (🔒) — edit title/desc/deadline/priority',
        'PATCH  /api/tasks/:id/complete (🔒) — toggle done',
        'DELETE /api/tasks/:id          (🔒)'
      ],
      habits: [
        'GET    /api/habits              (🔒) ?category=health',
        'GET    /api/habits/:id          (🔒)',
        'POST   /api/habits              (🔒)',
        'PUT    /api/habits/:id          (🔒) — rename / recategorize',
        'PATCH  /api/habits/:id/checkin  (🔒) — daily check-in',
        'DELETE /api/habits/:id          (🔒)'
      ],
      stats: [
        'GET    /api/stats               (🔒)'
      ]
    },
    note: '🔒 = requires Authorization: Bearer <token>'
  });
});

// ── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀  Server   : http://localhost:${PORT}`);
  console.log(`📡  API docs : http://localhost:${PORT}/api`);
});
