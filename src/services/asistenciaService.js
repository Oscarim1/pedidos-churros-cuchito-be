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

export async function getAsistenciaByDateAndUser(fecha, usuarioId) {
  const [rows] = await pool.query(
    `SELECT * 
     FROM asistencias 
     WHERE DATE(fecha) = ? 
       AND usuario_id = ? 
     ORDER BY fecha DESC`,
    [fecha, usuarioId]
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


const columnas = {
  horario_entrada: 'horario_entrada',
  horario_salida: 'horario_salida',
  horario_inicio_colacion: 'horario_inicio_colacion',
  horario_fin_colacion: 'horario_fin_colacion',
};

export async function updateAsistencia(id, tipo) {
  const columna = columnas[tipo];
  if (!columna) throw new Error('Tipo de asistencia inválido');

  const sql = `
    UPDATE asistencias
    SET ${columna} = NOW(), updated_at = NOW()
    WHERE id = ? AND ${columna} IS NULL
  `;
  const [result] = await pool.query(sql, [id]);

  if (result.affectedRows === 0) {
    const [rows] = await pool.query('SELECT * FROM asistencias WHERE id = ? LIMIT 1', [id]);
    return { alreadySet: true, asistencia: rows[0] || null };
  }

  const [rows] = await pool.query('SELECT * FROM asistencias WHERE id = ? LIMIT 1', [id]);
  return { alreadySet: false, asistencia: rows[0] || null };
}