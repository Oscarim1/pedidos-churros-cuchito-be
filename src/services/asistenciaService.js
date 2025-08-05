import { pool } from '../config/db.js';
import { randomUUID } from 'crypto';

export async function getAllAsistencias() {
  const [rows] = await pool.query('SELECT * FROM asistencias');
  return rows;
}

export async function getAsistenciaById(id) {
  const [rows] = await pool.query('SELECT * FROM asistencias WHERE id = ?', [id]);
  return rows[0];
}

export async function getAsistenciaByDate(fecha) {
  const [rows] = await pool.query(
    'SELECT * FROM asistencias WHERE DATE(fecha) = ? ORDER BY fecha DESC',
    [fecha]
  );
  return rows[0] || null; 
}

export async function createAsistencia({ usuario_id, tipo }) {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO asistencias (id, usuario_id, ${tipo}) VALUES (?, ?, NOW())`,
    [id, usuario_id]
  );
  const [rows] = await pool.query('SELECT * FROM asistencias WHERE id = ?', [id]);
  return rows[0];
}

export async function updateAsistencia(id, tipo) {
  await pool.query(
      `UPDATE asistencias SET ${tipo} = NOW() WHERE id = ?`,
      [id]
    );
  const [rows] = await pool.query('SELECT * FROM asistencias WHERE id = ?', [id]);
  return rows[0];
}

