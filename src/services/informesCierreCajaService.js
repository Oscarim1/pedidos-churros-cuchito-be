import { pool } from '../config/db.js';
import { randomUUID } from 'crypto';

export async function getAllInformesCierreCaja() {
  const [rows] = await pool.query('SELECT * FROM informes_cierres_caja');
  return rows;
}

export async function getInformeCierreCajaById(id) {
  const [rows] = await pool.query('SELECT * FROM informes_cierres_caja WHERE id = ?', [id]);
  return rows[0];
}

export async function createInformeCierreCaja({ monto_declarado_efectivo, monto_declarado_tarjeta, monto_declarado_pedidos_ya, fecha, cierre_caja_id }) {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO informes_cierres_caja (id, monto_declarado_efectivo, monto_declarado_tarjeta, monto_declarado_pedidos_ya, fecha, cierre_caja_id)` +
      ` VALUES (?, ?, ?, ?, ?, ?)`,
    [id, monto_declarado_efectivo, monto_declarado_tarjeta, monto_declarado_pedidos_ya, fecha, cierre_caja_id]
  );
  const [rows] = await pool.query('SELECT * FROM informes_cierres_caja WHERE id = ?', [id]);
  return rows[0];
}

export async function updateInformeCierreCaja(id, { monto_declarado_efectivo, monto_declarado_tarjeta, monto_declarado_pedidos_ya, fecha, cierre_caja_id }) {
  const [rows] = await pool.query('SELECT * FROM informes_cierres_caja WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const informe = rows[0];
  await pool.query(
    `UPDATE informes_cierres_caja SET monto_declarado_efectivo = ?, monto_declarado_tarjeta = ?, monto_declarado_pedidos_ya = ?, fecha = ?, cierre_caja_id = ?, updated_at = NOW() WHERE id = ?`,
    [
      monto_declarado_efectivo ?? informe.monto_declarado_efectivo,
      monto_declarado_tarjeta ?? informe.monto_declarado_tarjeta,
      monto_declarado_pedidos_ya ?? informe.monto_declarado_pedidos_ya,
      fecha ?? informe.fecha,
      cierre_caja_id ?? informe.cierre_caja_id,
      id
    ]
  );
  const [updated] = await pool.query('SELECT * FROM informes_cierres_caja WHERE id = ?', [id]);
  return updated[0];
}

export async function deleteInformeCierreCaja(id) {
  const [rows] = await pool.query('SELECT * FROM informes_cierres_caja WHERE id = ?', [id]);
  if (rows.length === 0) return false;
  await pool.query('DELETE FROM informes_cierres_caja WHERE id = ?', [id]);
  return true;
}
