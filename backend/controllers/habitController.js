// controllers/habitController.js — Full CRUD + category + check-in log
const db = require('../config/db');

// GET /api/habits?category=health
const getHabits = async (req, res) => {
  try {
    const { category } = req.query;
    let   sql    = 'SELECT * FROM habits WHERE user_id = ?';
    const params = [req.userId];

    if (category) { sql += ' AND category = ?'; params.push(category); }
    sql += ' ORDER BY name ASC';

    const [rows] = await db.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('getHabits:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch habits' });
  }
};

// GET /api/habits/:id
const getHabit = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM habits WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'Habit not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getHabit:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch habit' });
  }
};

// POST /api/habits
const createHabit = async (req, res) => {
  try {
    const { name, category = 'general' } = req.body;

    const [existing] = await db.query(
      'SELECT id FROM habits WHERE name = ? AND user_id = ?',
      [name.trim(), req.userId]
    );
    if (existing.length > 0)
      return res.status(409).json({ success: false, message: 'Habit already exists' });

    const today = new Date().toISOString().split('T')[0];
    const [result] = await db.query(
      'INSERT INTO habits (name, category, streak, longest_streak, last_updated, user_id) VALUES (?, ?, 0, 0, ?, ?)',
      [name.trim(), category.trim() || 'general', today, req.userId]
    );
    const [newHabit] = await db.query('SELECT * FROM habits WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Habit created', data: newHabit[0] });
  } catch (err) {
    console.error('createHabit:', err);
    res.status(500).json({ success: false, message: 'Failed to create habit' });
  }
};

// PUT /api/habits/:id  — rename or recategorize
const updateHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query(
      'SELECT * FROM habits WHERE id = ? AND user_id = ?', [id, req.userId]
    );
    if (!existing.length)
      return res.status(404).json({ success: false, message: 'Habit not found' });

    const h = existing[0];
    const { name = h.name, category = h.category } = req.body;

    if (!name?.trim())
      return res.status(400).json({ success: false, message: 'Name cannot be empty' });

    await db.query(
      'UPDATE habits SET name = ?, category = ? WHERE id = ? AND user_id = ?',
      [name.trim(), category.trim() || 'general', id, req.userId]
    );
    const [updated] = await db.query('SELECT * FROM habits WHERE id = ?', [id]);
    res.json({ success: true, message: 'Habit updated', data: updated[0] });
  } catch (err) {
    console.error('updateHabit:', err);
    res.status(500).json({ success: false, message: 'Failed to update habit' });
  }
};

// PATCH /api/habits/:id/checkin  — mark today's check-in, recalculate streak
const checkInHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query(
      'SELECT * FROM habits WHERE id = ? AND user_id = ?', [id, req.userId]
    );
    if (!existing.length)
      return res.status(404).json({ success: false, message: 'Habit not found' });

    const habit   = existing[0];
    const today   = new Date().toISOString().split('T')[0];
    const lastStr = habit.last_updated instanceof Date
      ? habit.last_updated.toISOString().split('T')[0]
      : String(habit.last_updated).split('T')[0];

    if (lastStr === today)
      return res.json({ success: false, message: 'Already checked in today ✅', data: habit });

    // Streak logic: consecutive = +1, gap > 1 day = reset to 1
    const diffDays   = Math.round(
      (new Date(today) - new Date(lastStr)) / 86_400_000
    );
    const newStreak     = diffDays === 1 ? habit.streak + 1 : 1;
    const longestStreak = Math.max(newStreak, habit.longest_streak);

    await db.query(
      'UPDATE habits SET streak = ?, longest_streak = ?, last_updated = ? WHERE id = ?',
      [newStreak, longestStreak, today, id]
    );

    // Append to audit log (IGNORE = silently skip if duplicate key)
    await db.query(
      'INSERT IGNORE INTO habit_logs (habit_id, user_id, checked_in_date) VALUES (?, ?, ?)',
      [id, req.userId, today]
    );

    const [updated] = await db.query('SELECT * FROM habits WHERE id = ?', [id]);
    res.json({
      success: true,
      message: `🔥 ${newStreak}-day streak!${newStreak > habit.streak && newStreak > 1 ? ' Keep it up!' : ''}`,
      data: updated[0]
    });
  } catch (err) {
    console.error('checkInHabit:', err);
    res.status(500).json({ success: false, message: 'Failed to check in' });
  }
};

// DELETE /api/habits/:id
const deleteHabit = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query(
      'SELECT id FROM habits WHERE id = ? AND user_id = ?', [id, req.userId]
    );
    if (!existing.length)
      return res.status(404).json({ success: false, message: 'Habit not found' });

    await db.query('DELETE FROM habits WHERE id = ?', [id]);
    res.json({ success: true, message: 'Habit deleted' });
  } catch (err) {
    console.error('deleteHabit:', err);
    res.status(500).json({ success: false, message: 'Failed to delete habit' });
  }
};

module.exports = { getHabits, getHabit, createHabit, updateHabit, checkInHabit, deleteHabit };
