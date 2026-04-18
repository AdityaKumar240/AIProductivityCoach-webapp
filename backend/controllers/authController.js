// controllers/authController.js — Register, Login & Profile
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const db     = require('../config/db');

const JWT_SECRET  = () => process.env.JWT_SECRET  || 'dev-secret-change-me';
const JWT_EXPIRES = () => process.env.JWT_EXPIRES  || '7d';

const signToken = (id) => jwt.sign({ id }, JWT_SECRET(), { expiresIn: JWT_EXPIRES() });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const [existing] = await db.query(
      'SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]
    );
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name.trim(), email.toLowerCase().trim(), hash]
    );

    const token = signToken(result.insertId);
    const [user] = await db.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?',
      [result.insertId]
    );
    res.status(201).json({ success: true, message: 'Account created', token, data: user[0] });
  } catch (err) {
    console.error('register:', err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      'SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]
    );
    if (rows.length === 0)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const token = signToken(user.id);
    const { password_hash: _pw, ...safeUser } = user;
    res.json({ success: true, message: 'Logged in successfully', token, data: safeUser });
  } catch (err) {
    console.error('login:', err);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// GET /api/auth/me  (protected)
const getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?', [req.userId]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getMe:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

// PUT /api/auth/me  (protected)
const updateMe = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim())
      return res.status(400).json({ success: false, message: 'Name is required' });

    await db.query('UPDATE users SET name = ? WHERE id = ?', [name.trim(), req.userId]);
    const [rows] = await db.query(
      'SELECT id, name, email, created_at FROM users WHERE id = ?', [req.userId]
    );
    res.json({ success: true, message: 'Profile updated', data: rows[0] });
  } catch (err) {
    console.error('updateMe:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

module.exports = { register, login, getMe, updateMe };
