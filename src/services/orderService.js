import { pool } from '../config/db.js';
import { randomUUID } from 'crypto';

export async function getAllOrders() {
  const [rows] = await pool.query('SELECT * FROM orders');
  return rows;
}

export async function getOrderById(id) {
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
  return rows[0];
}

export async function createOrder({ user_id, guest_name, total, points_used, points_earned, metodo_pago, status, order_number, is_active }) {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO orders (id, user_id, guest_name, total, points_used, points_earned, metodo_pago, status, order_number, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, user_id || null, guest_name || null, total, points_used ?? 0, points_earned ?? 0, metodo_pago || null, status || null, order_number || null, is_active ?? true]
  );
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
  return rows[0];
}

export async function updateOrder(id, { user_id, guest_name, total, points_used, points_earned, metodo_pago, status, order_number, is_active }) {
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const order = rows[0];
  await pool.query(
    `UPDATE orders SET user_id = ?, guest_name = ?, total = ?, points_used = ?, points_earned = ?, metodo_pago = ?, status = ?, order_number = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
    [
      user_id ?? order.user_id,
      guest_name ?? order.guest_name,
      total ?? order.total,
      points_used ?? order.points_used,
      points_earned ?? order.points_earned,
      metodo_pago ?? order.metodo_pago,
      status ?? order.status,
      order_number ?? order.order_number,
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
