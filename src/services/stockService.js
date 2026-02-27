import { pool } from '../config/db.js';
import { randomUUID } from 'crypto';

// ============================================================
// UBICACIONES
// ============================================================

export async function getAllLocations() {
  const [rows] = await pool.query(
    'SELECT * FROM locations WHERE is_active = 1 ORDER BY type, name'
  );
  return rows;
}

export async function getLocationById(id) {
  const [rows] = await pool.query('SELECT * FROM locations WHERE id = ?', [id]);
  return rows[0];
}

export async function createLocation({ name, type }) {
  const id = randomUUID();
  await pool.query(
    'INSERT INTO locations (id, name, type) VALUES (?, ?, ?)',
    [id, name, type]
  );
  const [rows] = await pool.query('SELECT * FROM locations WHERE id = ?', [id]);
  return rows[0];
}

export async function updateLocation(id, { name, type, is_active }) {
  const [existing] = await pool.query('SELECT * FROM locations WHERE id = ?', [id]);
  if (existing.length === 0) return null;

  const location = existing[0];
  await pool.query(
    'UPDATE locations SET name = ?, type = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
    [name ?? location.name, type ?? location.type, is_active ?? location.is_active, id]
  );
  const [rows] = await pool.query('SELECT * FROM locations WHERE id = ?', [id]);
  return rows[0];
}

// ============================================================
// STOCK POR UBICACIÓN
// ============================================================

export async function getStockByLocation(locationId) {
  const [rows] = await pool.query(
    `SELECT
      ps.id,
      ps.product_id,
      p.name AS product_name,
      p.category,
      p.price,
      ps.location_id,
      l.name AS location_name,
      ps.quantity,
      ps.min_quantity,
      CASE WHEN ps.quantity <= ps.min_quantity THEN 1 ELSE 0 END AS low_stock,
      ps.updated_at
    FROM product_stock ps
    JOIN products p ON ps.product_id = p.id
    JOIN locations l ON ps.location_id = l.id
    WHERE ps.location_id = ?
    ORDER BY p.name`,
    [locationId]
  );
  return rows;
}

export async function getStockByProduct(productId) {
  const [rows] = await pool.query(
    `SELECT
      ps.id,
      ps.product_id,
      p.name AS product_name,
      ps.location_id,
      l.name AS location_name,
      l.type AS location_type,
      ps.quantity,
      ps.min_quantity,
      ps.updated_at
    FROM product_stock ps
    JOIN products p ON ps.product_id = p.id
    JOIN locations l ON ps.location_id = l.id
    WHERE ps.product_id = ?
    ORDER BY l.type, l.name`,
    [productId]
  );
  return rows;
}

export async function getAllStock() {
  const [rows] = await pool.query(
    `SELECT
      ps.id,
      ps.product_id,
      p.name AS product_name,
      p.category,
      p.price,
      ps.location_id,
      l.name AS location_name,
      l.type AS location_type,
      ps.quantity,
      ps.min_quantity,
      CASE WHEN ps.quantity <= ps.min_quantity THEN 1 ELSE 0 END AS low_stock,
      ps.updated_at
    FROM product_stock ps
    JOIN products p ON ps.product_id = p.id
    JOIN locations l ON ps.location_id = l.id
    WHERE l.is_active = 1
    ORDER BY l.type, l.name, p.name`
  );
  return rows;
}

export async function setMinQuantity(productId, locationId, minQuantity) {
  const [existing] = await pool.query(
    'SELECT id FROM product_stock WHERE product_id = ? AND location_id = ?',
    [productId, locationId]
  );

  if (existing.length === 0) {
    const id = randomUUID();
    await pool.query(
      'INSERT INTO product_stock (id, product_id, location_id, quantity, min_quantity) VALUES (?, ?, ?, 0, ?)',
      [id, productId, locationId, minQuantity]
    );
  } else {
    await pool.query(
      'UPDATE product_stock SET min_quantity = ?, updated_at = NOW() WHERE product_id = ? AND location_id = ?',
      [minQuantity, productId, locationId]
    );
  }

  const [rows] = await pool.query(
    'SELECT * FROM product_stock WHERE product_id = ? AND location_id = ?',
    [productId, locationId]
  );
  return rows[0];
}

// ============================================================
// MOVIMIENTOS DE STOCK
// ============================================================

const MOVEMENT_TYPES = {
  COMPRA_PROVEEDOR: 'compra_proveedor',
  REPOSICION: 'reposicion',
  VENTA: 'venta',
  CONSUMO_EMPLEADO: 'consumo_empleado',
  AJUSTE: 'ajuste',
  MERMA: 'merma'
};

async function updateStockQuantity(connection, productId, locationId, quantityDelta) {
  const [existing] = await connection.query(
    'SELECT id, quantity FROM product_stock WHERE product_id = ? AND location_id = ?',
    [productId, locationId]
  );

  if (existing.length === 0) {
    if (quantityDelta < 0) {
      throw new Error('No hay stock registrado para este producto en esta ubicación');
    }
    const id = randomUUID();
    await connection.query(
      'INSERT INTO product_stock (id, product_id, location_id, quantity) VALUES (?, ?, ?, ?)',
      [id, productId, locationId, quantityDelta]
    );
  } else {
    const newQuantity = existing[0].quantity + quantityDelta;
    if (newQuantity < 0) {
      throw new Error(`Stock insuficiente. Disponible: ${existing[0].quantity}, Solicitado: ${Math.abs(quantityDelta)}`);
    }
    await connection.query(
      'UPDATE product_stock SET quantity = ?, updated_at = NOW() WHERE id = ?',
      [newQuantity, existing[0].id]
    );
  }
}

async function createMovementRecord(connection, data) {
  const id = randomUUID();
  await connection.query(
    `INSERT INTO stock_movements
      (id, product_id, from_location_id, to_location_id, quantity, type, user_id, employee_id, reference_table, reference_id, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      data.productId,
      data.fromLocationId || null,
      data.toLocationId || null,
      data.quantity,
      data.type,
      data.userId || null,
      data.employeeId || null,
      data.referenceTable || null,
      data.referenceId || null,
      data.notes || null
    ]
  );
  return id;
}

/**
 * Registrar compra de proveedor (entrada a bodega)
 */
export async function registerPurchase({ productId, locationId, quantity, userId, notes }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await updateStockQuantity(connection, productId, locationId, quantity);

    const movementId = await createMovementRecord(connection, {
      productId,
      toLocationId: locationId,
      quantity,
      type: MOVEMENT_TYPES.COMPRA_PROVEEDOR,
      userId,
      notes
    });

    await connection.commit();

    const [movement] = await pool.query(
      `SELECT sm.*, p.name AS product_name, l.name AS to_location_name
       FROM stock_movements sm
       JOIN products p ON sm.product_id = p.id
       LEFT JOIN locations l ON sm.to_location_id = l.id
       WHERE sm.id = ?`,
      [movementId]
    );
    return movement[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Registrar reposición (de bodega a máquina/vitrina)
 */
export async function registerRestock({ productId, fromLocationId, toLocationId, quantity, userId, notes }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Descontar de origen
    await updateStockQuantity(connection, productId, fromLocationId, -quantity);
    // Agregar a destino
    await updateStockQuantity(connection, productId, toLocationId, quantity);

    const movementId = await createMovementRecord(connection, {
      productId,
      fromLocationId,
      toLocationId,
      quantity,
      type: MOVEMENT_TYPES.REPOSICION,
      userId,
      notes
    });

    await connection.commit();

    const [movement] = await pool.query(
      `SELECT sm.*, p.name AS product_name,
              lf.name AS from_location_name, lt.name AS to_location_name
       FROM stock_movements sm
       JOIN products p ON sm.product_id = p.id
       LEFT JOIN locations lf ON sm.from_location_id = lf.id
       LEFT JOIN locations lt ON sm.to_location_id = lt.id
       WHERE sm.id = ?`,
      [movementId]
    );
    return movement[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Registrar venta (salida desde máquina/vitrina)
 */
export async function registerSale({ productId, locationId, quantity, userId, orderId, notes }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await updateStockQuantity(connection, productId, locationId, -quantity);

    const movementId = await createMovementRecord(connection, {
      productId,
      fromLocationId: locationId,
      quantity,
      type: MOVEMENT_TYPES.VENTA,
      userId,
      referenceTable: orderId ? 'orders' : null,
      referenceId: orderId || null,
      notes
    });

    await connection.commit();

    const [movement] = await pool.query(
      `SELECT sm.*, p.name AS product_name, l.name AS from_location_name
       FROM stock_movements sm
       JOIN products p ON sm.product_id = p.id
       LEFT JOIN locations l ON sm.from_location_id = l.id
       WHERE sm.id = ?`,
      [movementId]
    );
    return movement[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Registrar consumo de empleado (bebida tomada por trabajador)
 */
export async function registerEmployeeConsumption({ productId, locationId, quantity, userId, employeeId, notes }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await updateStockQuantity(connection, productId, locationId, -quantity);

    const movementId = await createMovementRecord(connection, {
      productId,
      fromLocationId: locationId,
      quantity,
      type: MOVEMENT_TYPES.CONSUMO_EMPLEADO,
      userId,
      employeeId,
      notes
    });

    await connection.commit();

    const [movement] = await pool.query(
      `SELECT sm.*, p.name AS product_name, l.name AS from_location_name,
              e.username AS employee_name
       FROM stock_movements sm
       JOIN products p ON sm.product_id = p.id
       LEFT JOIN locations l ON sm.from_location_id = l.id
       LEFT JOIN users e ON sm.employee_id = e.id
       WHERE sm.id = ?`,
      [movementId]
    );
    return movement[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Registrar ajuste de inventario (corrección manual)
 */
export async function registerAdjustment({ productId, locationId, quantity, userId, notes }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await updateStockQuantity(connection, productId, locationId, quantity);

    const movementId = await createMovementRecord(connection, {
      productId,
      fromLocationId: quantity < 0 ? locationId : null,
      toLocationId: quantity > 0 ? locationId : null,
      quantity: Math.abs(quantity),
      type: MOVEMENT_TYPES.AJUSTE,
      userId,
      notes
    });

    await connection.commit();

    const [movement] = await pool.query(
      `SELECT sm.*, p.name AS product_name
       FROM stock_movements sm
       JOIN products p ON sm.product_id = p.id
       WHERE sm.id = ?`,
      [movementId]
    );
    return movement[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Registrar merma (producto dañado/vencido)
 */
export async function registerWaste({ productId, locationId, quantity, userId, notes }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    await updateStockQuantity(connection, productId, locationId, -quantity);

    const movementId = await createMovementRecord(connection, {
      productId,
      fromLocationId: locationId,
      quantity,
      type: MOVEMENT_TYPES.MERMA,
      userId,
      notes
    });

    await connection.commit();

    const [movement] = await pool.query(
      `SELECT sm.*, p.name AS product_name, l.name AS from_location_name
       FROM stock_movements sm
       JOIN products p ON sm.product_id = p.id
       LEFT JOIN locations l ON sm.from_location_id = l.id
       WHERE sm.id = ?`,
      [movementId]
    );
    return movement[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ============================================================
// CONSULTAS Y REPORTES
// ============================================================

export async function getMovements({ productId, locationId, type, startDate, endDate, limit = 100 }) {
  let sql = `
    SELECT
      sm.id,
      sm.product_id,
      p.name AS product_name,
      sm.from_location_id,
      lf.name AS from_location_name,
      sm.to_location_id,
      lt.name AS to_location_name,
      sm.quantity,
      sm.type,
      sm.user_id,
      u.username AS user_name,
      sm.employee_id,
      e.username AS employee_name,
      sm.reference_table,
      sm.reference_id,
      sm.notes,
      sm.created_at
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    LEFT JOIN locations lf ON sm.from_location_id = lf.id
    LEFT JOIN locations lt ON sm.to_location_id = lt.id
    LEFT JOIN users u ON sm.user_id = u.id
    LEFT JOIN users e ON sm.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (productId) {
    sql += ' AND sm.product_id = ?';
    params.push(productId);
  }
  if (locationId) {
    sql += ' AND (sm.from_location_id = ? OR sm.to_location_id = ?)';
    params.push(locationId, locationId);
  }
  if (type) {
    sql += ' AND sm.type = ?';
    params.push(type);
  }
  if (startDate) {
    sql += ' AND sm.created_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND sm.created_at <= ?';
    params.push(endDate);
  }

  sql += ' ORDER BY sm.created_at DESC LIMIT ?';
  params.push(limit);

  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function getStockSummary() {
  const [rows] = await pool.query(`
    SELECT
      l.id AS location_id,
      l.name AS location_name,
      l.type AS location_type,
      COUNT(DISTINCT ps.product_id) AS total_products,
      SUM(ps.quantity) AS total_units,
      SUM(CASE WHEN ps.quantity <= ps.min_quantity THEN 1 ELSE 0 END) AS low_stock_count
    FROM locations l
    LEFT JOIN product_stock ps ON l.id = ps.location_id
    WHERE l.is_active = 1
    GROUP BY l.id, l.name, l.type
    ORDER BY l.type, l.name
  `);
  return rows;
}

export async function getMovementsSummary({ startDate, endDate }) {
  const [rows] = await pool.query(`
    SELECT
      sm.type,
      COUNT(*) AS movement_count,
      SUM(sm.quantity) AS total_quantity,
      COUNT(DISTINCT sm.product_id) AS products_affected
    FROM stock_movements sm
    WHERE sm.created_at >= ? AND sm.created_at <= ?
    GROUP BY sm.type
    ORDER BY sm.type
  `, [startDate, endDate]);
  return rows;
}

export async function getEmployeeConsumptionReport({ startDate, endDate }) {
  const [rows] = await pool.query(`
    SELECT
      e.id AS employee_id,
      e.username AS employee_name,
      p.id AS product_id,
      p.name AS product_name,
      p.category,
      SUM(sm.quantity) AS total_consumed,
      COUNT(*) AS times_consumed
    FROM stock_movements sm
    JOIN products p ON sm.product_id = p.id
    LEFT JOIN users e ON sm.employee_id = e.id
    WHERE sm.type = 'consumo_empleado'
      AND sm.created_at >= ? AND sm.created_at <= ?
    GROUP BY e.id, e.username, p.id, p.name, p.category
    ORDER BY e.username, total_consumed DESC
  `, [startDate, endDate]);
  return rows;
}

export async function getProductMovementHistory(productId, { startDate, endDate }) {
  const [rows] = await pool.query(`
    SELECT
      DATE(sm.created_at) AS date,
      sm.type,
      SUM(sm.quantity) AS quantity,
      lf.name AS from_location,
      lt.name AS to_location
    FROM stock_movements sm
    LEFT JOIN locations lf ON sm.from_location_id = lf.id
    LEFT JOIN locations lt ON sm.to_location_id = lt.id
    WHERE sm.product_id = ?
      AND sm.created_at >= ? AND sm.created_at <= ?
    GROUP BY DATE(sm.created_at), sm.type, lf.name, lt.name
    ORDER BY DATE(sm.created_at) DESC, sm.type
  `, [productId, startDate, endDate]);
  return rows;
}
