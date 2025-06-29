import { pool } from '../config/db.js';
import { randomUUID } from 'crypto';

export async function getAllCierresCaja() {
  const [rows] = await pool.query('SELECT * FROM cierres_caja');
  return rows;
}

export async function getCierreCajaById(id) {
  const [rows] = await pool.query('SELECT * FROM cierres_caja WHERE id = ?', [id]);
  return rows[0];
}

export async function createCierreCaja({ fecha, total_efectivo, total_maquinas, maquina1, pedidos_ya, salidas_efectivo, ingresos_efectivo, usuario_id, observacion, total_pagos_tarjeta_web, is_active }) {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO cierres_caja (id, fecha, total_efectivo, total_maquinas, maquina1, pedidos_ya, salidas_efectivo, ingresos_efectivo, usuario_id, observacion, total_pagos_tarjeta_web, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, fecha, total_efectivo, total_maquinas, maquina1, pedidos_ya, salidas_efectivo, ingresos_efectivo, usuario_id, observacion || null, total_pagos_tarjeta_web, is_active ?? true]
  );
  const [rows] = await pool.query('SELECT * FROM cierres_caja WHERE id = ?', [id]);
  return rows[0];
}

export async function updateCierreCaja(id, { fecha, total_efectivo, total_maquinas, maquina1, pedidos_ya, salidas_efectivo, ingresos_efectivo, usuario_id, observacion, total_pagos_tarjeta_web, is_active }) {
  const [rows] = await pool.query('SELECT * FROM cierres_caja WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const cierre = rows[0];
  await pool.query(
    `UPDATE cierres_caja SET fecha = ?, total_efectivo = ?, total_maquinas = ?, maquina1 = ?, pedidos_ya = ?, salidas_efectivo = ?, ingresos_efectivo = ?, usuario_id = ?, observacion = ?, total_pagos_tarjeta_web = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
    [
      fecha ?? cierre.fecha,
      total_efectivo ?? cierre.total_efectivo,
      total_maquinas ?? cierre.total_maquinas,
      maquina1 ?? cierre.maquina1,
      pedidos_ya ?? cierre.pedidos_ya,
      salidas_efectivo ?? cierre.salidas_efectivo,
      ingresos_efectivo ?? cierre.ingresos_efectivo,
      usuario_id ?? cierre.usuario_id,
      observacion ?? cierre.observacion,
      total_pagos_tarjeta_web ?? cierre.total_pagos_tarjeta_web,
      is_active ?? cierre.is_active,
      id
    ]
  );
  const [updated] = await pool.query('SELECT * FROM cierres_caja WHERE id = ?', [id]);
  return updated[0];
}

export async function deleteCierreCaja(id) {
  const [rows] = await pool.query('SELECT * FROM cierres_caja WHERE id = ?', [id]);
  if (rows.length === 0) return false;
  await pool.query('DELETE FROM cierres_caja WHERE id = ?', [id]);
  return true;
}
