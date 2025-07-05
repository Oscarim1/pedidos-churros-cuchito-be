// src/services/authservice.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

export function generarAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

export function generarRefreshToken(payload) {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '8d' });
}

export async function findUserByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0];
}

export async function createUser({ username, email, passwordHash, role_id }) {
  const [result] = await pool.query(
    `INSERT INTO users (username, email, password_hash, role_id, created_at, is_active)
     VALUES (?, ?, ?, ?, NOW(), 1)`,
    [username, email, passwordHash, role_id]
  );
  return result.insertId;
}

export async function saveRefreshToken(userId, token) {
  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
    [userId, token]
  );
}

export async function findRefreshToken(token, userId) {
  const [rows] = await pool.query(
    'SELECT * FROM refresh_tokens WHERE token = ? AND user_id = ? AND is_valid = 1 AND expires_at > NOW()',
    [token, userId]
  );
  return rows[0];
}

export async function logout(refreshToken) {
  await pool.query(
    'UPDATE refresh_tokens SET is_valid = 0 WHERE token = ?',
    [refreshToken]
  );
}
