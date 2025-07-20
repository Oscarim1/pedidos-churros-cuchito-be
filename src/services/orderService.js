import { pool } from '../config/db.js';
import { randomUUID } from 'crypto';

export async function getAllOrders() {
  const [rows] = await pool.query('SELECT * FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) ORDER BY created_at DESC');
  return rows;
}

export async function getOrderById(id) {
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
  return rows[0];
}

export async function getOrderWithItems(id) {
  const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
  if (orderRows.length === 0) return null;
  const order = orderRows[0];
  const [items] = await pool.query(
    `SELECT oi.*, p.name, p.category
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
    [id]
  );
  order.items = items;
  return order;
}

// Cambios aquí: No recibimos order_number como parámetro
export async function createOrder({ user_id, guest_name, total, points_used, points_earned, metodo_pago, status, is_active }) {
  const id = randomUUID();

  // Obtener el último order_number del día actual
  const [rows] = await pool.query(
    `SELECT MAX(order_number) AS last_order FROM orders WHERE DATE(created_at) = CURDATE()`
  );
  const lastOrder = rows[0]?.last_order ?? 0;
  const order_number = lastOrder + 1;

  // Insertar la orden con el nuevo order_number
  await pool.query(
    `INSERT INTO orders (id, user_id, guest_name, total, points_used, points_earned, metodo_pago, status, order_number, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      user_id || null,
      guest_name || null,
      total,
      points_used ?? 0,
      points_earned ?? 0,
      metodo_pago || null,
      status || null,
      order_number,
      is_active ?? true
    ]
  );
  const [created] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
  return created[0];
}

export async function updateOrder(id, { user_id, guest_name, total, points_used, points_earned, metodo_pago, status, is_active }) {
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const order = rows[0];
  await pool.query(
    `UPDATE orders SET user_id = ?, guest_name = ?, total = ?, points_used = ?, points_earned = ?, metodo_pago = ?, status = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
    [
      user_id ?? order.user_id,
      guest_name ?? order.guest_name,
      total ?? order.total,
      points_used ?? order.points_used,
      points_earned ?? order.points_earned,
      metodo_pago ?? order.metodo_pago,
      status ?? order.status,
      is_active ?? order.is_active,
      id
    ]
  );
  const [updated] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
  return updated[0];
}

export async function deleteOrder(id) {
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
  if (rows.length === 0) return false;
  await pool.query('DELETE FROM orders WHERE id = ?', [id]);
  return true;
}

export async function getTotalByDate(fecha) {
  const [rows] = await pool.query(
    `SELECT
      DATE(CONVERT_TZ(created_at, 'UTC', 'America/Santiago')) AS fecha,
      metodo_pago,
      FORMAT(SUM(total), 2) AS total_por_dia
     FROM orders
     WHERE DATE(CONVERT_TZ(created_at, 'UTC', 'America/Santiago')) = ?
     GROUP BY fecha, metodo_pago
     ORDER BY fecha DESC, metodo_pago`,
    [fecha]
  );
  return rows;
}
