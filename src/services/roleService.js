import { pool } from '../config/db.js';

export async function getAllRoles() {
  const [rows] = await pool.query('SELECT * FROM roles');
  return rows;
}

export async function getRoleById(id) {
  const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
  return rows[0];
}

export async function getRoleByName(name) {
  const [rows] = await pool.query('SELECT * FROM roles WHERE name = ?', [name]);
  return rows[0];
}

export async function createRole({ name, description, is_active }) {
  const [result] = await pool.query(
    'INSERT INTO roles (name, description, is_active) VALUES (?, ?, ?)',
    [name, description || null, is_active ?? true]
  );
  const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [result.insertId]);
  return rows[0];
}

export async function updateRole(id, { name, description, is_active }) {
  const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const role = rows[0];
  await pool.query(
    'UPDATE roles SET name = ?, description = ?, is_active = ? WHERE id = ?',
    [name ?? role.name, description ?? role.description, is_active ?? role.is_active, id]
  );
  const [updated] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
  return updated[0];
}

export async function deleteRole(id) {
  const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
  if (rows.length === 0) return false;
  await pool.query('DELETE FROM roles WHERE id = ?', [id]);
  return true;
}
