// config/db.js — MySQL connection pool
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host:             process.env.DB_HOST     || 'localhost',
  user:             process.env.DB_USER     || 'root',
  password:         process.env.DB_PASSWORD || '',
  database:         process.env.DB_NAME     || 'ai_coach_db',
  port:             process.env.DB_PORT     || 3306,
  waitForConnections: true,
  connectionLimit:  10,
  queueLimit:       0
});

const promisePool = pool.promise();

pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    return;
  }
  console.log('✅ Connected to MySQL successfully!');
  connection.release();
});

module.exports = promisePool;
