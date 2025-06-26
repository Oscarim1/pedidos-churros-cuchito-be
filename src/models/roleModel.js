const pool = require('../config/db');

exports.getAll = async () => {
  const [rows] = await pool.query('SELECT id, name, description, is_active FROM roles WHERE is_active = 1');
  return rows;
};

exports.getById = async (id) => {
  const [rows] = await pool.query('SELECT id, name, description, is_active FROM roles WHERE id = ? AND is_active = 1', [id]);
  return rows[0];
};

exports.create = async ({ name, description }) => {
  const [result] = await pool.query(
    'INSERT INTO roles (name, description, is_active) VALUES (?, ?, 1)',
    [name, description]
  );
  return result.insertId;
};

exports.update = async (id, { name, description }) => {
  const [result] = await pool.query(
    'UPDATE roles SET name=?, description=? WHERE id=? AND is_active = 1',
    [name, description, id]
  );
  return result.affectedRows;
};

exports.softDelete = async (id) => {
  const [result] = await pool.query(
    'UPDATE roles SET is_active=0 WHERE id=?',
    [id]
  );
  return result.affectedRows;
};
