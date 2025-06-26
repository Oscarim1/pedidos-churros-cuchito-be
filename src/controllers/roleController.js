import { pool } from '../config/db.js';

export const getRoles = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM roles');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRoleById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Role not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createRole = async (req, res) => {
  const { name, description, is_active } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });
  try {
    const [result] = await pool.query(
      'INSERT INTO roles (name, description, is_active) VALUES (?, ?, ?)',
      [name, description || null, is_active ?? true]
    );
    const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRole = async (req, res) => {
  const { id } = req.params;
  const { name, description, is_active } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Role not found' });
    const role = rows[0];
    await pool.query(
      'UPDATE roles SET name = ?, description = ?, is_active = ? WHERE id = ?',
      [name ?? role.name, description ?? role.description, is_active ?? role.is_active, id]
    );
    const [updated] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteRole = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Role not found' });
    await pool.query('DELETE FROM roles WHERE id = ?', [id]);
    res.json({ message: 'Role deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
