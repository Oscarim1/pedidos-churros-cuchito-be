import * as authLogService from '../services/authLogService.js';

/**
 * Obtiene el historial de accesos del usuario autenticado
 */
export const getMyAuthLogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const logs = await authLogService.getAuthLogsByUser(userId, limit);
    res.json({ logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener historial de accesos' });
  }
};

/**
 * Obtiene las IPs únicas desde las que el usuario ha accedido
 */
export const getMyUniqueIps = async (req, res) => {
  try {
    const userId = req.user.id;

    const ips = await authLogService.getUniqueIpsByUser(userId);
    res.json({ ips });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener IPs únicas' });
  }
};

/**
 * [ADMIN] Obtiene todos los logs de autenticación
 */
export const getAllAuthLogs = async (req, res) => {
  try {
    const { limit, offset, eventType, userId } = req.query;

    const result = await authLogService.getAllAuthLogs({
      limit: parseInt(limit) || 100,
      offset: parseInt(offset) || 0,
      eventType: eventType || null,
      userId: userId || null
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener logs de autenticación' });
  }
};

/**
 * [ADMIN] Obtiene historial de accesos de un usuario específico
 */
export const getAuthLogsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const logs = await authLogService.getAuthLogsByUser(userId, limit);
    res.json({ logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener historial de accesos' });
  }
};

/**
 * [ADMIN] Obtiene IPs únicas de un usuario específico
 */
export const getUniqueIpsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const ips = await authLogService.getUniqueIpsByUser(userId);
    res.json({ ips });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener IPs únicas' });
  }
};

/**
 * [ADMIN] Detecta accesos desde IPs no autorizadas
 */
export const detectSuspiciousAccess = async (req, res) => {
  try {
    const { knownIps, hours } = req.body;

    const suspiciousAccess = await authLogService.detectSuspiciousAccess(
      knownIps || [],
      parseInt(hours) || 24
    );

    res.json({
      suspicious_count: suspiciousAccess.length,
      accesses: suspiciousAccess
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al detectar accesos sospechosos' });
  }
};

/**
 * [ADMIN] Obtiene estadísticas de intentos fallidos
 */
export const getFailedAttempts = async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;

    const stats = await authLogService.getFailedAttemptStats(hours);
    res.json({ failed_attempts: stats });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener intentos fallidos' });
  }
};

/**
 * [ADMIN] Dashboard de auth logs con estadísticas consolidadas
 */
export const getAuthLogsDashboard = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    const dashboard = await authLogService.getAuthLogsDashboard(days);
    res.json(dashboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error al obtener dashboard de auth logs' });
  }
};
