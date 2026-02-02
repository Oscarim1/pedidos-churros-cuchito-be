import { pool } from '../config/db.js';

// ============================================================================
// HELPER: Calcular rangos de fecha según período
// ============================================================================

/**
 * Calcula el rango de fechas basado en el período y fecha base
 * @param {'day'|'week'|'month'} period
 * @param {string} date - Fecha base en formato YYYY-MM-DD
 * @param {string|null} from - Fecha inicio opcional
 * @param {string|null} to - Fecha fin opcional
 * @returns {{ from: string, to: string }}
 */
export function calculateDateRange(period, date, from = null, to = null) {
  // Si vienen from y to explícitos, usarlos
  if (from && to) {
    return { from, to };
  }

  const baseDate = new Date(date + 'T00:00:00');

  switch (period) {
    case 'day':
      return { from: date, to: date };

    case 'week': {
      // Lunes a domingo de la semana del date
      // getDay(): 0=domingo, 1=lunes, ..., 6=sábado
      const dayOfWeek = baseDate.getDay();
      // Convertir a: 0=lunes, 1=martes, ..., 6=domingo
      const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

      const monday = new Date(baseDate);
      monday.setDate(baseDate.getDate() + mondayOffset);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      return {
        from: formatDate(monday),
        to: formatDate(sunday)
      };
    }

    case 'month': {
      // Primer y último día del mes
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      return {
        from: formatDate(firstDay),
        to: formatDate(lastDay)
      };
    }

    default:
      throw new Error(`Invalid period: ${period}`);
  }
}

/**
 * Formatea Date a YYYY-MM-DD
 */
function formatDate(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================================================
// SQL QUERIES
// ============================================================================

/**
 * SQL: KPIs totales del rango
 * - totalVentas, totalEfectivo, totalTarjeta, pedidos
 */
const SQL_KPIS = `
  SELECT
    COALESCE(SUM(total), 0) AS totalVentas,
    COALESCE(SUM(CASE WHEN metodo_pago = 'efectivo' THEN total ELSE 0 END), 0) AS totalEfectivo,
    COALESCE(SUM(CASE WHEN metodo_pago = 'tarjeta' THEN total ELSE 0 END), 0) AS totalTarjeta,
    COUNT(*) AS pedidos
  FROM orders
  WHERE status = 'complete'
    AND is_active = 1
    AND DATE(created_at) BETWEEN ? AND ?
`;

/**
 * SQL: Serie por hora (para period=day)
 */
const SQL_SERIES_BY_HOUR = `
  SELECT
    HOUR(created_at) AS label,
    COALESCE(SUM(total), 0) AS ventas,
    COUNT(*) AS pedidos
  FROM orders
  WHERE status = 'complete'
    AND is_active = 1
    AND DATE(created_at) = ?
  GROUP BY HOUR(created_at)
  ORDER BY label ASC
`;

/**
 * SQL: Serie por día (para period=week|month)
 */
const SQL_SERIES_BY_DAY = `
  SELECT
    DATE(created_at) AS label,
    COALESCE(SUM(total), 0) AS ventas,
    COUNT(*) AS pedidos
  FROM orders
  WHERE status = 'complete'
    AND is_active = 1
    AND DATE(created_at) BETWEEN ? AND ?
  GROUP BY DATE(created_at)
  ORDER BY label ASC
`;

/**
 * SQL: Ventas por categoría
 */
const SQL_CATEGORIAS = `
  SELECT
    p.category,
    SUM(oi.quantity) AS unidades,
    SUM(oi.quantity * oi.price) AS total
  FROM order_items oi
  INNER JOIN orders o ON oi.order_id = o.id
  INNER JOIN products p ON oi.product_id = p.id
  WHERE o.status = 'complete'
    AND o.is_active = 1
    AND oi.is_active = 1
    AND DATE(o.created_at) BETWEEN ? AND ?
  GROUP BY p.category
  ORDER BY total DESC
`;

/**
 * SQL: Top 10 productos
 */
const SQL_TOP_PRODUCTOS = `
  SELECT
    p.name,
    p.category,
    p.sub_category,
    SUM(oi.quantity) AS unidades,
    SUM(oi.quantity * oi.price) AS total
  FROM order_items oi
  INNER JOIN orders o ON oi.order_id = o.id
  INNER JOIN products p ON oi.product_id = p.id
  WHERE o.status = 'complete'
    AND o.is_active = 1
    AND oi.is_active = 1
    AND DATE(o.created_at) BETWEEN ? AND ?
  GROUP BY p.id, p.name, p.category, p.sub_category
  ORDER BY total DESC
  LIMIT 10
`;

/**
 * SQL: Últimos 10 pedidos
 */
const SQL_ULTIMOS_PEDIDOS = `
  SELECT
    order_number,
    DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS fecha_hora,
    metodo_pago,
    total
  FROM orders
  WHERE status = 'complete'
    AND is_active = 1
    AND DATE(created_at) BETWEEN ? AND ?
  ORDER BY created_at DESC
  LIMIT 10
`;

/**
 * SQL: Asistencia - lista de trabajadores que asistieron con sus horarios
 */
const SQL_ASISTENCIA = `
  SELECT
    u.id,
    u.username AS nombre,
    DATE_FORMAT(a.fecha, '%Y-%m-%d') AS fecha,
    DATE_FORMAT(a.horario_entrada, '%H:%i') AS horario_entrada,
    DATE_FORMAT(a.horario_salida, '%H:%i') AS horario_salida
  FROM asistencias a
  INNER JOIN users u ON a.usuario_id = u.id
  WHERE DATE(a.fecha) BETWEEN ? AND ?
  ORDER BY a.fecha DESC, u.username ASC
`;

// ============================================================================
// SERVICE FUNCTIONS
// ============================================================================

/**
 * Obtiene los KPIs del rango
 */
export async function getKpis(from, to) {
  const [rows] = await pool.query(SQL_KPIS, [from, to]);
  const row = rows[0];

  const totalVentas = parseFloat(row.totalVentas) || 0;
  const totalEfectivo = parseFloat(row.totalEfectivo) || 0;
  const totalTarjeta = parseFloat(row.totalTarjeta) || 0;
  const pedidos = parseInt(row.pedidos, 10) || 0;

  const ticketPromedio = pedidos > 0 ? totalVentas / pedidos : 0;
  const pctEfectivo = totalVentas > 0 ? (totalEfectivo / totalVentas) * 100 : 0;
  const pctTarjeta = totalVentas > 0 ? (totalTarjeta / totalVentas) * 100 : 0;

  return {
    totalVentas: Math.round(totalVentas),
    totalEfectivo: Math.round(totalEfectivo),
    totalTarjeta: Math.round(totalTarjeta),
    pedidos,
    ticketPromedio: Math.round(ticketPromedio),
    mixPago: {
      pctEfectivo: Math.round(pctEfectivo * 100) / 100,
      pctTarjeta: Math.round(pctTarjeta * 100) / 100
    }
  };
}

/**
 * Obtiene la serie temporal (por hora o por día)
 */
export async function getSeries(period, from, to) {
  let rows;
  let labels = [];
  let ventasMap = new Map();
  let pedidosMap = new Map();

  if (period === 'day') {
    // Serie por hora (0-23)
    [rows] = await pool.query(SQL_SERIES_BY_HOUR, [from]);

    // Inicializar todas las horas
    for (let h = 0; h < 24; h++) {
      const label = `${String(h).padStart(2, '0')}:00`;
      labels.push(label);
      ventasMap.set(h, 0);
      pedidosMap.set(h, 0);
    }

    // Llenar con datos reales
    for (const row of rows) {
      const hour = parseInt(row.label, 10);
      ventasMap.set(hour, parseFloat(row.ventas) || 0);
      pedidosMap.set(hour, parseInt(row.pedidos, 10) || 0);
    }

    return {
      labels,
      ventas: Array.from({ length: 24 }, (_, i) => Math.round(ventasMap.get(i))),
      pedidos: Array.from({ length: 24 }, (_, i) => pedidosMap.get(i))
    };
  } else {
    // Serie por día
    [rows] = await pool.query(SQL_SERIES_BY_DAY, [from, to]);

    // Generar todos los días del rango
    const startDate = new Date(from + 'T00:00:00');
    const endDate = new Date(to + 'T00:00:00');

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDate(d);
      labels.push(dateStr);
      ventasMap.set(dateStr, 0);
      pedidosMap.set(dateStr, 0);
    }

    // Llenar con datos reales
    for (const row of rows) {
      const dateStr = typeof row.label === 'string'
        ? row.label.split('T')[0]
        : formatDate(new Date(row.label));
      ventasMap.set(dateStr, parseFloat(row.ventas) || 0);
      pedidosMap.set(dateStr, parseInt(row.pedidos, 10) || 0);
    }

    return {
      labels,
      ventas: labels.map(l => Math.round(ventasMap.get(l))),
      pedidos: labels.map(l => pedidosMap.get(l))
    };
  }
}

/**
 * Obtiene ventas por categoría
 */
export async function getCategorias(from, to) {
  const [rows] = await pool.query(SQL_CATEGORIAS, [from, to]);

  return rows.map(row => ({
    category: row.category || 'Sin categoría',
    unidades: parseInt(row.unidades, 10) || 0,
    total: Math.round(parseFloat(row.total) || 0)
  }));
}

/**
 * Obtiene top 10 productos
 */
export async function getTopProductos(from, to) {
  const [rows] = await pool.query(SQL_TOP_PRODUCTOS, [from, to]);

  return rows.map(row => ({
    name: row.name,
    category: row.category || 'Sin categoría',
    sub_category: row.sub_category || null,
    unidades: parseInt(row.unidades, 10) || 0,
    total: Math.round(parseFloat(row.total) || 0)
  }));
}

/**
 * Obtiene últimos 10 pedidos
 */
export async function getUltimosPedidos(from, to) {
  const [rows] = await pool.query(SQL_ULTIMOS_PEDIDOS, [from, to]);

  return rows.map(row => ({
    order_number: row.order_number,
    fecha_hora: row.fecha_hora,
    metodo_pago: row.metodo_pago,
    total: Math.round(parseFloat(row.total) || 0)
  }));
}

/**
 * Obtiene lista de trabajadores que asistieron con sus horarios
 */
export async function getAsistencia(from, to) {
  try {
    const [rows] = await pool.query(SQL_ASISTENCIA, [from, to]);

    // Obtener trabajadores únicos (por si hay múltiples días)
    const trabajadoresUnicos = new Set(rows.map(r => r.id));

    return {
      trabajadoresAsistieron: trabajadoresUnicos.size,
      trabajadores: rows.map(row => ({
        id: row.id,
        nombre: row.nombre,
        fecha: row.fecha,
        horario_entrada: row.horario_entrada || null,
        horario_salida: row.horario_salida || null
      }))
    };
  } catch (err) {
    // Si la tabla no existe, devolver datos vacíos
    if (err.code === 'ER_NO_SUCH_TABLE') {
      console.warn('Tabla asistencias no existe, devolviendo datos vacíos');
      return {
        trabajadoresAsistieron: 0,
        trabajadores: []
      };
    }
    throw err;
  }
}

// ============================================================================
// MAIN FUNCTION: getDashboardData
// ============================================================================

/**
 * Obtiene todos los datos del dashboard ejecutando queries en paralelo
 * @param {'day'|'week'|'month'} period
 * @param {string} from - YYYY-MM-DD
 * @param {string} to - YYYY-MM-DD
 */
export async function getDashboardData(period, from, to) {
  // Ejecutar todas las queries en paralelo para mejor performance
  const [kpis, series, categorias, topProductos, ultimosPedidos, asistencia] = await Promise.all([
    getKpis(from, to),
    getSeries(period, from, to),
    getCategorias(from, to),
    getTopProductos(from, to),
    getUltimosPedidos(from, to),
    getAsistencia(from, to)
  ]);

  return {
    meta: {
      period,
      from,
      to,
      timezone: 'America/Santiago'
    },
    kpis,
    series,
    categorias,
    topProductos,
    ultimosPedidos,
    asistencia
  };
}
