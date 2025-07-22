import { pool } from '../config/db.js';
import { randomUUID } from 'crypto';
import { getTotalByDate } from './orderService.js';
import { createInformeCierreCaja } from './informesCierreCajaService.js';

export async function getAllCierresCaja() {
  const [rows] = await pool.query('SELECT * FROM cierres_caja');
  return rows;
}

export async function getCierreCajaById(id) {
  const [rows] = await pool.query('SELECT * FROM cierres_caja WHERE id = ?', [id]);
  return rows[0];
}

export async function getCierreCajaByDate(fecha) {
  const [rows] = await pool.query(
    'SELECT * FROM cierres_caja WHERE DATE(fecha) = ? ORDER BY fecha DESC',
    [fecha]
  );
  
  return rows[0] || null; 
}

export async function createCierreCaja({ fecha, total_efectivo, total_maquinas, salidas_efectivo, ingresos_efectivo, usuario_id, observacion, is_active }) {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO cierres_caja (id, fecha, total_efectivo, total_maquinas, salidas_efectivo, ingresos_efectivo, usuario_id, observacion, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, fecha, total_efectivo, total_maquinas, salidas_efectivo, ingresos_efectivo, usuario_id, observacion || null, is_active ?? true]
  );
  const [rows] = await pool.query('SELECT * FROM cierres_caja WHERE id = ?', [id]);
  return rows[0];
}

export async function updateCierreCaja(id, { fecha, total_efectivo, total_maquinas, salidas_efectivo, ingresos_efectivo, usuario_id, observacion, is_active }) {
  const [rows] = await pool.query('SELECT * FROM cierres_caja WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const cierre = rows[0];
  await pool.query(
    `UPDATE cierres_caja SET fecha = ?, total_efectivo = ?, total_maquinas = ?, salidas_efectivo = ?, ingresos_efectivo = ?, usuario_id = ?, observacion = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
    [
      fecha ?? cierre.fecha,
      total_efectivo ?? cierre.total_efectivo,
      total_maquinas ?? cierre.total_maquinas,
      salidas_efectivo ?? cierre.salidas_efectivo,
      ingresos_efectivo ?? cierre.ingresos_efectivo,
      usuario_id ?? cierre.usuario_id,
      observacion ?? cierre.observacion,
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

export async function generateCierreCaja({
  fecha,
  monto_declarado_efectivo,
  monto_declarado_tarjeta,
  monto_declarado_pedidos_ya,
  salidas_efectivo,
  ingresos_efectivo,
  usuario_id,
  observacion,
  is_active
}) {
  const totals = await getTotalByDate(fecha);
  let totalEfectivo = 0;
  let totalMaquinas = 0;

  for (const t of totals) {
    const metodo = (t.metodo_pago || '').toLowerCase();
    const monto = parseFloat(String(t.total_por_dia).replace(/,/g, '')) || 0;
    if (metodo.includes('efectivo')) {
      totalEfectivo += monto;
    } else {
      totalMaquinas += monto;
    }
  }

  const cierre = await createCierreCaja({
    fecha,
    total_efectivo: totalEfectivo,
    total_maquinas: totalMaquinas,
    salidas_efectivo: salidas_efectivo ?? 0,
    ingresos_efectivo: ingresos_efectivo ?? 0,
    usuario_id,
    observacion,
    is_active
  });

  await createInformeCierreCaja({
    monto_declarado_efectivo,
    monto_declarado_tarjeta,
    monto_declarado_pedidos_ya,
    fecha,
    cierre_caja_id: cierre.id
  });

  return cierre;
}
