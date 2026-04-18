// controllers/taskController.js — Full CRUD + priority + completion toggle
const db = require('../config/db');

const VALID_PRIORITIES = ['low', 'medium', 'high'];

// GET /api/tasks?completed=true&priority=high
const getTasks = async (req, res) => {
  try {
    const { completed, priority } = req.query;
    let   sql    = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [req.userId];

    if (completed !== undefined) {
      sql += ' AND is_completed = ?';
      params.push(completed === 'true' ? 1 : 0);
    }
    if (priority && VALID_PRIORITIES.includes(priority)) {
      sql += ' AND priority = ?';
      params.push(priority);
    }

    // Pending first, then by priority (high→low), then by deadline
    sql += ' ORDER BY is_completed ASC, FIELD(priority,"high","medium","low"), deadline ASC';

    const [rows] = await db.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    console.error('getTasks:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch tasks' });
  }
};

// GET /api/tasks/:id
const getTask = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [req.params.id, req.userId]
    );
    if (!rows.length)
      return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getTask:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch task' });
  }
};

// POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description = '', deadline = null, priority = 'medium' } = req.body;
    const p = VALID_PRIORITIES.includes(priority) ? priority : 'medium';

    const [result] = await db.query(
      `INSERT INTO tasks (title, description, deadline, priority, is_completed, user_id)
       VALUES (?, ?, ?, ?, FALSE, ?)`,
      [title.trim(), description.trim(), deadline || null, p, req.userId]
    );
    const [newTask] = await db.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Task created', data: newTask[0] });
  } catch (err) {
    console.error('createTask:', err);
    res.status(500).json({ success: false, message: 'Failed to create task' });
  }
};

// PUT /api/tasks/:id  — edit fields (title, description, deadline, priority)
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, req.userId]
    );
    if (!existing.length)
      return res.status(404).json({ success: false, message: 'Task not found' });

    const t = existing[0];
    const {
      title       = t.title,
      description = t.description,
      deadline    = t.deadline,
      priority    = t.priority
    } = req.body;

    if (!title?.trim())
      return res.status(400).json({ success: false, message: 'Title cannot be empty' });

    const p = VALID_PRIORITIES.includes(priority) ? priority : t.priority;

    await db.query(
      `UPDATE tasks SET title = ?, description = ?, deadline = ?, priority = ? WHERE id = ? AND user_id = ?`,
      [title.trim(), description ?? '', deadline || null, p, id, req.userId]
    );
    const [updated] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json({ success: true, message: 'Task updated', data: updated[0] });
  } catch (err) {
    console.error('updateTask:', err);
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
};

// PATCH /api/tasks/:id/complete  — toggle completion
const completeTask = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?', [id, req.userId]
    );
    if (!existing.length)
      return res.status(404).json({ success: false, message: 'Task not found' });

    const isCompleted = !existing[0].is_completed;
    const completedAt = isCompleted ? new Date() : null;

    await db.query(
      'UPDATE tasks SET is_completed = ?, completed_at = ? WHERE id = ?',
      [isCompleted, completedAt, id]
    );
    const [updated] = await db.query('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json({
      success: true,
      message: isCompleted ? 'Task completed! 🎉' : 'Task reopened',
      data: updated[0]
    });
  } catch (err) {
    console.error('completeTask:', err);
    res.status(500).json({ success: false, message: 'Failed to update task' });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.query(
      'SELECT id FROM tasks WHERE id = ? AND user_id = ?', [id, req.userId]
    );
    if (!existing.length)
      return res.status(404).json({ success: false, message: 'Task not found' });

    await db.query('DELETE FROM tasks WHERE id = ?', [id]);
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    console.error('deleteTask:', err);
    res.status(500).json({ success: false, message: 'Failed to delete task' });
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, completeTask, deleteTask };
