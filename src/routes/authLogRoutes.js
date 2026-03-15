import express from 'express';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { tieneRol } from '../middlewares/roleMiddleware.js';
import {
  getMyAuthLogs,
  getMyUniqueIps,
  getAllAuthLogs,
  getAuthLogsByUser,
  getUniqueIpsByUser,
  detectSuspiciousAccess,
  getFailedAttempts,
  getAuthLogsDashboard
} from '../controllers/authLogController.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

// Rutas para el usuario autenticado (ver su propio historial)
router.get('/me', getMyAuthLogs);
router.get('/me/ips', getMyUniqueIps);

// Rutas de administrador
router.get('/', tieneRol('admin'), getAllAuthLogs);
router.get('/dashboard', tieneRol('admin'), getAuthLogsDashboard);
router.get('/failed-attempts', tieneRol('admin'), getFailedAttempts);
router.post('/suspicious', tieneRol('admin'), detectSuspiciousAccess);
router.get('/user/:userId', tieneRol('admin'), getAuthLogsByUser);
router.get('/user/:userId/ips', tieneRol('admin'), getUniqueIpsByUser);

export default router;

/**
 * @swagger
 * tags:
 *   name: AuthLogs
 *   description: Logs de autenticación y auditoría de accesos
 */

/**
 * @swagger
 * /auth-logs/me:
 *   get:
 *     summary: Obtiene el historial de accesos del usuario autenticado
 *     tags: [AuthLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Cantidad de registros a retornar
 *     responses:
 *       200:
 *         description: Lista de accesos del usuario
 *       401:
 *         description: No autenticado
 */

/**
 * @swagger
 * /auth-logs/me/ips:
 *   get:
 *     summary: Obtiene las IPs únicas desde las que el usuario ha accedido
 *     tags: [AuthLogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de IPs únicas con conteo de accesos
 *       401:
 *         description: No autenticado
 */

/**
 * @swagger
 * /auth-logs:
 *   get:
 *     summary: "[ADMIN] Obtiene todos los logs de autenticación"
 *     tags: [AuthLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *           enum: [login_success, login_failed, logout, refresh_token, register]
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista paginada de logs
 *       403:
 *         description: No tiene permisos de administrador
 */

/**
 * @swagger
 * /auth-logs/failed-attempts:
 *   get:
 *     summary: "[ADMIN] Obtiene estadísticas de intentos fallidos de login"
 *     tags: [AuthLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *         description: Ventana de tiempo en horas
 *     responses:
 *       200:
 *         description: IPs con múltiples intentos fallidos
 *       403:
 *         description: No tiene permisos de administrador
 */

/**
 * @swagger
 * /auth-logs/suspicious:
 *   post:
 *     summary: "[ADMIN] Detecta accesos desde IPs no autorizadas"
 *     tags: [AuthLogs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               knownIps:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["190.215.45.123", "192.168.1.1"]
 *               hours:
 *                 type: integer
 *                 default: 24
 *     responses:
 *       200:
 *         description: Lista de accesos sospechosos
 *       403:
 *         description: No tiene permisos de administrador
 */

/**
 * @swagger
 * /auth-logs/user/{userId}:
 *   get:
 *     summary: "[ADMIN] Obtiene historial de accesos de un usuario"
 *     tags: [AuthLogs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de accesos del usuario
 *       403:
 *         description: No tiene permisos de administrador
 */
