import { pool } from '../config/db.js';
import { extractRequestMetadata } from '../utils/deviceParser.js';

/**
 * Registra un evento de autenticación
 * @param {Object} params - Parámetros del log
 * @param {string} params.userId - ID del usuario (puede ser null si login falló)
 * @param {string} params.email - Email usado en el intento
 * @param {string} params.eventType - Tipo de evento (login_success, login_failed, logout, etc)
 * @param {Object} params.req - Express request object
 * @param {string} params.failureReason - Razón del fallo (opcional)
 */
export async function logAuthEvent({ userId, email, eventType, req, failureReason = null }) {
  try {
    const metadata = extractRequestMetadata(req);

    await pool.query(
      `INSERT INTO auth_logs (
        user_id, email, event_type, ip_address, user_agent,
        device_type, os_name, os_version, browser_name, browser_version,
        failure_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        email,
        eventType,
        metadata.ipAddress,
        metadata.userAgent,
        metadata.deviceType,
        metadata.osName,
        metadata.osVersion,
        metadata.browserName,
        metadata.browserVersion,
        failureReason
      ]
    );
  } catch (error) {
    // No queremos que un error de logging rompa el flujo de auth
    console.error('Error al registrar auth log:', error);
  }
}

/**
 * Obtiene el historial de accesos de un usuario
 * @param {string} userId - ID del usuario
 * @param {number} limit - Cantidad de registros a retornar
 * @returns {Array} Lista de logs de autenticación
 */
export async function getAuthLogsByUser(userId, limit = 50) {
  const [rows] = await pool.query(
    `SELECT
      id, event_type, ip_address, device_type,
      CONCAT(os_name, ' ', os_version) as sistema_operativo,
      CONCAT(browser_name, ' ', browser_version) as navegador,
      failure_reason, created_at
    FROM auth_logs
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?`,
    [userId, limit]
  );
  return rows;
}

/**
 * Obtiene todas las IPs únicas desde las que un usuario ha accedido
 * @param {string} userId - ID del usuario
 * @returns {Array} Lista de IPs con conteo de accesos
 */
export async function getUniqueIpsByUser(userId) {
  const [rows] = await pool.query(
    `SELECT
      ip_address,
      COUNT(*) as access_count,
      MAX(created_at) as last_access,
      MIN(created_at) as first_access
    FROM auth_logs
    WHERE user_id = ? AND event_type = 'login_success'
    GROUP BY ip_address
    ORDER BY last_access DESC`,
    [userId]
  );
  return rows;
}

/**
 * Obtiene logs de acceso para todos los usuarios (admin)
 * @param {Object} filters - Filtros opcionales
 * @param {number} filters.limit - Límite de registros
 * @param {number} filters.offset - Offset para paginación
 * @param {string} filters.eventType - Filtrar por tipo de evento
 * @param {string} filters.userId - Filtrar por usuario específico
 * @returns {Object} Lista de logs y total
 */
export async function getAllAuthLogs({ limit = 100, offset = 0, eventType = null, userId = null } = {}) {
  let query = `
    SELECT
      al.id,
      al.user_id,
      u.username,
      al.email,
      al.event_type,
      al.ip_address,
      al.device_type,
      CONCAT(al.os_name, ' ', al.os_version) as sistema_operativo,
      CONCAT(al.browser_name, ' ', al.browser_version) as navegador,
      al.failure_reason,
      al.created_at
    FROM auth_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (eventType) {
    query += ' AND al.event_type = ?';
    params.push(eventType);
  }

  if (userId) {
    query += ' AND al.user_id = ?';
    params.push(userId);
  }

  query += ' ORDER BY al.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const [rows] = await pool.query(query, params);

  // Obtener total para paginación
  let countQuery = 'SELECT COUNT(*) as total FROM auth_logs WHERE 1=1';
  const countParams = [];

  if (eventType) {
    countQuery += ' AND event_type = ?';
    countParams.push(eventType);
  }

  if (userId) {
    countQuery += ' AND user_id = ?';
    countParams.push(userId);
  }

  const [[{ total }]] = await pool.query(countQuery, countParams);

  return { logs: rows, total, limit, offset };
}

/**
 * Detecta accesos desde IPs desconocidas (posible acceso no autorizado)
 * @param {Array} knownIps - Lista de IPs conocidas/autorizadas
 * @param {number} hours - Ventana de tiempo en horas para buscar
 * @returns {Array} Accesos sospechosos
 */
export async function detectSuspiciousAccess(knownIps = [], hours = 24) {
  const placeholders = knownIps.length > 0 ? knownIps.map(() => '?').join(',') : "'__none__'";

  const [rows] = await pool.query(
    `SELECT
      al.id,
      al.user_id,
      u.username,
      al.email,
      al.ip_address,
      al.device_type,
      CONCAT(al.os_name, ' ', al.os_version) as sistema_operativo,
      CONCAT(al.browser_name, ' ', al.browser_version) as navegador,
      al.created_at
    FROM auth_logs al
    LEFT JOIN users u ON al.user_id = u.id
    WHERE al.event_type = 'login_success'
      AND al.ip_address NOT IN (${placeholders})
      AND al.created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    ORDER BY al.created_at DESC`,
    [...knownIps, hours]
  );
  return rows;
}

/**
 * Obtiene estadísticas de intentos fallidos (posibles ataques)
 * @param {number} hours - Ventana de tiempo en horas
 * @returns {Array} IPs con múltiples fallos
 */
export async function getFailedAttemptStats(hours = 24) {
  const [rows] = await pool.query(
    `SELECT
      ip_address,
      COUNT(*) as failed_attempts,
      GROUP_CONCAT(DISTINCT email) as emails_attempted,
      MAX(created_at) as last_attempt
    FROM auth_logs
    WHERE event_type = 'login_failed'
      AND created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    GROUP BY ip_address
    HAVING failed_attempts >= 3
    ORDER BY failed_attempts DESC`,
    [hours]
  );
  return rows;
}

/**
 * Obtiene estadísticas para el dashboard de auth logs
 * @param {number} days - Días hacia atrás para las estadísticas
 * @returns {Object} Estadísticas consolidadas
 */
export async function getAuthLogsDashboard(days = 7) {
  // Estadísticas generales
  const [[stats]] = await pool.query(
    `SELECT
      COUNT(*) as total_events,
      SUM(CASE WHEN event_type = 'login_success' THEN 1 ELSE 0 END) as successful_logins,
      SUM(CASE WHEN event_type = 'login_failed' THEN 1 ELSE 0 END) as failed_logins,
      SUM(CASE WHEN event_type = 'logout' THEN 1 ELSE 0 END) as logouts,
      SUM(CASE WHEN event_type = 'register' THEN 1 ELSE 0 END) as registrations,
      COUNT(DISTINCT ip_address) as unique_ips,
      COUNT(DISTINCT user_id) as unique_users
    FROM auth_logs
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [days]
  );

  // IPs más frecuentes
  const [topIps] = await pool.query(
    `SELECT
      ip_address,
      COUNT(*) as access_count,
      COUNT(DISTINCT user_id) as users_count,
      MAX(created_at) as last_access
    FROM auth_logs
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND event_type = 'login_success'
    GROUP BY ip_address
    ORDER BY access_count DESC
    LIMIT 10`,
    [days]
  );

  // Actividad por día
  const [dailyActivity] = await pool.query(
    `SELECT
      DATE(created_at) as date,
      COUNT(*) as total,
      SUM(CASE WHEN event_type = 'login_success' THEN 1 ELSE 0 END) as successful,
      SUM(CASE WHEN event_type = 'login_failed' THEN 1 ELSE 0 END) as failed
    FROM auth_logs
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY DATE(created_at)
    ORDER BY date DESC`,
    [days]
  );

  // Dispositivos más usados
  const [devices] = await pool.query(
    `SELECT
      device_type,
      CONCAT(os_name, ' ', os_version) as os,
      CONCAT(browser_name, ' ', browser_version) as browser,
      COUNT(*) as count
    FROM auth_logs
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      AND event_type = 'login_success'
    GROUP BY device_type, os_name, os_version, browser_name, browser_version
    ORDER BY count DESC
    LIMIT 10`,
    [days]
  );

  // Últimos accesos
  const [recentLogins] = await pool.query(
    `SELECT
      al.id,
      al.user_id,
      u.username,
      al.email,
      al.event_type,
      al.ip_address,
      al.device_type,
      CONCAT(al.os_name, ' ', al.os_version) as sistema_operativo,
      CONCAT(al.browser_name, ' ', al.browser_version) as navegador,
      al.failure_reason,
      al.created_at
    FROM auth_logs al
    LEFT JOIN users u ON al.user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT 20`
  );

  return {
    stats,
    topIps,
    dailyActivity,
    devices,
    recentLogins
  };
}
