// controllers/statsController.js — Productivity analytics for the dashboard
const db = require('../config/db');

// GET /api/stats
const getStats = async (req, res) => {
  try {
    const uid = req.userId;

    // ── Task breakdown ───────────────────────────────────────────────────────
    const [[taskStats]] = await db.query(`
      SELECT
        COUNT(*)                                                       AS total_tasks,
        COALESCE(SUM(is_completed), 0)                                 AS completed_tasks,
        COALESCE(SUM(is_completed = 0), 0)                             AS pending_tasks,
        COALESCE(SUM(deadline < CURDATE() AND is_completed = 0), 0)    AS overdue_tasks,
        COALESCE(SUM(priority = 'high'   AND is_completed = 0), 0)     AS high_priority_pending,
        COALESCE(SUM(priority = 'medium' AND is_completed = 0), 0)     AS medium_priority_pending,
        COALESCE(SUM(priority = 'low'    AND is_completed = 0), 0)     AS low_priority_pending
      FROM tasks
      WHERE user_id = ?
    `, [uid]);

    // ── Habit breakdown ──────────────────────────────────────────────────────
    const [[habitStats]] = await db.query(`
      SELECT
        COUNT(*)                         AS total_habits,
        COALESCE(MAX(streak), 0)         AS best_current_streak,
        COALESCE(MAX(longest_streak), 0) AS best_ever_streak,
        COALESCE(AVG(streak), 0)         AS avg_streak
      FROM habits
      WHERE user_id = ?
    `, [uid]);

    // ── Check-ins — last 7 days ──────────────────────────────────────────────
    const [weeklyCheckins] = await db.query(`
      SELECT checked_in_date AS date, COUNT(*) AS count
      FROM habit_logs
      WHERE user_id = ?
        AND checked_in_date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY checked_in_date
      ORDER BY checked_in_date
    `, [uid]);

    // ── Tasks completed — last 7 days ────────────────────────────────────────
    const [weeklyCompleted] = await db.query(`
      SELECT DATE(completed_at) AS date, COUNT(*) AS count
      FROM tasks
      WHERE user_id = ?
        AND is_completed = 1
        AND completed_at >= DATE_SUB(NOW(), INTERVAL 6 DAY)
      GROUP BY DATE(completed_at)
      ORDER BY date
    `, [uid]);

    // ── Habits by category ───────────────────────────────────────────────────
    const [byCategory] = await db.query(`
      SELECT category, COUNT(*) AS count, AVG(streak) AS avg_streak
      FROM habits
      WHERE user_id = ?
      GROUP BY category
      ORDER BY count DESC
    `, [uid]);

    res.json({
      success: true,
      data: {
        tasks:   taskStats,
        habits:  habitStats,
        weekly:  { checkins: weeklyCheckins, completedTasks: weeklyCompleted },
        categories: byCategory
      }
    });
  } catch (err) {
    console.error('getStats:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};

module.exports = { getStats };
