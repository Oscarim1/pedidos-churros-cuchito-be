import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';

export const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createUser = async (req, res) => {
  const { username, email, password, rut, role_id, points } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ message: 'username, email and password are required' });
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (username, email, password_hash, rut, role_id, points) VALUES (?, ?, ?, ?, ?, ?)',
      [username, email, passwordHash, rut || null, role_id || null, points || 0]
    );
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, rut, role_id, points, is_active } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
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
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
