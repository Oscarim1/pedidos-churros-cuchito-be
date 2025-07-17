import { pool } from '../config/db.js';
import { randomUUID } from 'crypto';

export async function getAllProducts() {
  const [rows] = await pool.query('SELECT * FROM products ORDER BY price ASC');
  return rows;
}

export async function getProductById(id) {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  return rows[0];
}

export async function createProduct({ name, price, points, image_url, description, precio_puntos, category, sub_category, is_active }) {
  const id = randomUUID();
  await pool.query(
    `INSERT INTO products (id, name, price, points, image_url, description, precio_puntos, category, sub_category, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, price, points ?? 0, image_url || null, description || null, precio_puntos ?? 0, category || null, sub_category || null, is_active ?? true]
  );
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  return rows[0];
}

export async function updateProduct(id, { name, price, points, image_url, description, precio_puntos, category, sub_category, is_active }) {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  const product = rows[0];
  await pool.query(
    `UPDATE products SET name = ?, price = ?, points = ?, image_url = ?, description = ?, precio_puntos = ?, category = ?, sub_category = ?, is_active = ?, updated_at = NOW() WHERE id = ?`,
    [
      name ?? product.name,
      price ?? product.price,
      points ?? product.points,
      image_url ?? product.image_url,
      description ?? product.description,
      precio_puntos ?? product.precio_puntos,
      category ?? product.category,
      sub_category ?? product.sub_category,
      is_active ?? product.is_active,
      id
    ]
  );
  const [updated] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  return updated[0];
}

export async function deleteProduct(id) {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
  if (rows.length === 0) return false;
  await pool.query('DELETE FROM products WHERE id = ?', [id]);
  return true;
}
