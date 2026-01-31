import express from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Proteger rutas con autenticación
router.use(verificarToken);

/**
 * @route GET /api/dashboard
 * @description Obtiene datos del dashboard de ventas
 * @query {string} period - 'day' | 'week' | 'month' (obligatorio)
 * @query {string} [date] - Fecha base YYYY-MM-DD (default: hoy)
 * @query {string} [from] - Fecha inicio del rango YYYY-MM-DD
 * @query {string} [to] - Fecha fin del rango YYYY-MM-DD
 * @access Private
 *
 * @example
 * GET /api/dashboard?period=day&date=2026-01-31
 * GET /api/dashboard?period=week&date=2026-01-31
 * GET /api/dashboard?period=month&date=2026-01-31
 * GET /api/dashboard?period=week&from=2026-01-01&to=2026-01-07
 */
router.get('/', getDashboard);

export default router;
