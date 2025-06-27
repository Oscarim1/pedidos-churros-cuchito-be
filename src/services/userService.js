import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';

export async function getAllUsers() {
  const [rows] = await pool.query('SELECT * FROM users');
  return rows;
}

export async function getUserById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0];
}

export async function createUser({ username, email, password, rut, role_id, points }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (username, email, password_hash, rut, role_id, points) VALUES (?, ?, ?, ?, ?, ?)',
    [username, email, passwordHash, rut || null, role_id || null, points || 0]
  );
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
  return rows[0];
}

export async function updateUser(id, { username, email, password, rut, role_id, points, is_active }) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const user = rows[0];
  const passwordHash = password ? await bcrypt.hash(password, 10) : user.password_hash;
  await pool.query(
    `UPDATE users SET username = ?, email = ?, password_hash = ?, rut = ?, role_id = ?, points = ?, is_active = ? WHERE id = ?`,
    [
      username ?? user.username,
      email ?? user.email,
      passwordHash,
      rut ?? user.rut,
      role_id ?? user.role_id,
      points ?? user.points,
      is_active ?? user.is_active,
      id
    ]
  );
  const [updated] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return updated[0];
}

export async function deleteUser(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  if (rows.length === 0) return false;
  await pool.query('DELETE FROM users WHERE id = ?', [id]);
  return true;
}
