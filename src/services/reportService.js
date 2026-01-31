import { pool } from '../config/db.js';

export async function getVentasPorRango(fechaInicio, fechaFin) {
  const sql = `
    SELECT
      DATE(CONVERT_TZ(created_at, 'UTC', 'America/Santiago')) AS fecha,
      metodo_pago,
      SUM(total) AS total_por_dia
    FROM orders
    WHERE DATE(CONVERT_TZ(created_at, 'UTC', 'America/Santiago'))
          BETWEEN ? AND ?
    GROUP BY fecha, metodo_pago
    ORDER BY fecha DESC, metodo_pago
  `;

  const [rows] = await pool.query(sql, [fechaInicio, fechaFin]);

  return rows.map(row => ({
    ...row,
    total_por_dia: Number(row.total_por_dia).toLocaleString('es-CL')
  }));
}
