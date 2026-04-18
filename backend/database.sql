-- ============================================================
-- database.sql — AI Productivity Coach v2.0
-- Run manually : mysql -u root -p < database.sql
-- Docker       : auto-imported via docker-entrypoint-initdb.d
-- ============================================================

CREATE DATABASE IF NOT EXISTS ai_coach_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ai_coach_db;

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            INT           NOT NULL AUTO_INCREMENT,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Tasks ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id           INT          NOT NULL AUTO_INCREMENT,
  title        VARCHAR(200) NOT NULL,
  description  TEXT,
  deadline     DATE,
  priority     ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  is_completed BOOLEAN      NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP    NULL,
  user_id      INT          NOT NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tasks_user      (user_id),
  INDEX idx_tasks_deadline  (deadline),
  INDEX idx_tasks_priority  (priority),
  INDEX idx_tasks_completed (is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Habits ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS habits (
  id             INT          NOT NULL AUTO_INCREMENT,
  name           VARCHAR(100) NOT NULL,
  category       VARCHAR(50)  NOT NULL DEFAULT 'general',
  streak         INT          NOT NULL DEFAULT 0,
  longest_streak INT          NOT NULL DEFAULT 0,
  last_updated   DATE         NOT NULL,
  user_id        INT          NOT NULL,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_habit (user_id, name),
  INDEX idx_habits_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Habit Check-in Log ────────────────────────────────────────────────────────
-- Preserves full history; enables streak recalculation and calendar heatmaps.
CREATE TABLE IF NOT EXISTS habit_logs (
  id              INT  NOT NULL AUTO_INCREMENT,
  habit_id        INT  NOT NULL,
  user_id         INT  NOT NULL,
  checked_in_date DATE NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  UNIQUE KEY uq_habit_date (habit_id, checked_in_date),
  INDEX idx_hlogs_user (user_id),
  INDEX idx_hlogs_date (checked_in_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── AI Suggestion Log ─────────────────────────────────────────────────────────
-- Records every coaching message shown, useful for analytics & deduplication.
CREATE TABLE IF NOT EXISTS ai_suggestions_log (
  id              INT  NOT NULL AUTO_INCREMENT,
  user_id         INT  NOT NULL,
  suggestion_text TEXT NOT NULL,
  suggestion_type ENUM('task','habit','general') NOT NULL DEFAULT 'general',
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_ailog_user    (user_id),
  INDEX idx_ailog_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Productivity Stats View ───────────────────────────────────────────────────
CREATE OR REPLACE VIEW user_stats AS
SELECT
  u.id                                                                 AS user_id,
  u.name,
  COUNT(DISTINCT t.id)                                                 AS total_tasks,
  COALESCE(SUM(t.is_completed), 0)                                     AS completed_tasks,
  COALESCE(SUM(t.is_completed = 0), 0)                                 AS pending_tasks,
  COALESCE(SUM(t.deadline < CURDATE() AND t.is_completed = 0), 0)      AS overdue_tasks,
  COUNT(DISTINCT h.id)                                                 AS total_habits,
  COALESCE(MAX(h.streak), 0)                                           AS best_current_streak,
  COALESCE(MAX(h.longest_streak), 0)                                   AS best_ever_streak
FROM users u
LEFT JOIN tasks  t ON t.user_id = u.id
LEFT JOIN habits h ON h.user_id = u.id
GROUP BY u.id, u.name;

SHOW TABLES;
SELECT 'Database setup complete! (v2.0)' AS status;
