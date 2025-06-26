const pool = require('../config/db');


exports.getAll = async () => {
  const [rows] = await pool.query('SELECT id, username, email, role_id, is_active, created_at FROM users WHERE is_active = 1');
  return rows;
};

exports.getById = async (id) => {
  const [rows] = await pool.query('SELECT id, username, email, role_id, is_active, created_at FROM users WHERE id = ? AND is_active = 1', [id]);
  return rows[0];
};

exports.getByEmail = async (email) => {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
};

exports.create = async (user) => {
  const { username, email, password_hash, role_id } = user;
  const [result] = await pool.query(
    'INSERT INTO users (username, email, password_hash, role_id, is_active) VALUES (?, ?, ?, ?, 1)',
    [username, email, password_hash, role_id]
  );
  return result.insertId;
};

exports.update = async (id, user) => {
  const { username, email, role_id } = user;
  const [result] = await pool.query(
    'UPDATE users SET username=?, email=?, role_id=? WHERE id=? AND is_active = 1',
    [username, email, role_id, id]
  );
  return result.affectedRows;
};

exports.softDelete = async (id) => {
  const [result] = await pool.query(
    'UPDATE users SET is_active=0 WHERE id=?',
    [id]
  );
  return result.affectedRows;
};
