import { pool } from '../config/db.js';
import { randomUUID } from 'crypto';

export async function getAllOrderItems() {
  const [rows] = await pool.query('SELECT * FROM order_items');
  return rows;
}

export async function getOrderItemById(id) {
  const [rows] = await pool.query('SELECT * FROM order_items WHERE id = ?', [id]);
  return rows[0];
}

export async function createOrderItem({ order_id, product_id, quantity, price, is_active }) {
  const id = randomUUID();
  await pool.query(
    'INSERT INTO order_items (id, order_id, product_id, quantity, price, is_active) VALUES (?, ?, ?, ?, ?, ?)',
    [id, order_id, product_id, quantity ?? 1, price, is_active ?? true]
  );
  const [rows] = await pool.query('SELECT * FROM order_items WHERE id = ?', [id]);
  return rows[0];
}

export async function updateOrderItem(id, { order_id, product_id, quantity, price, is_active }) {
  const [rows] = await pool.query('SELECT * FROM order_items WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const item = rows[0];
  await pool.query(
    'UPDATE order_items SET order_id = ?, product_id = ?, quantity = ?, price = ?, is_active = ? WHERE id = ?',
    [
      order_id ?? item.order_id,
      product_id ?? item.product_id,
      quantity ?? item.quantity,
      price ?? item.price,
      is_active ?? item.is_active,
      id
    ]
  );
  const [updated] = await pool.query('SELECT * FROM order_items WHERE id = ?', [id]);
  return updated[0];
}

export async function deleteOrderItem(id) {
  const [rows] = await pool.query('SELECT * FROM order_items WHERE id = ?', [id]);
  if (rows.length === 0) return false;
  await pool.query('DELETE FROM order_items WHERE id = ?', [id]);
  return true;
}
