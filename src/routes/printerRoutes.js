import { Router } from 'express';
import { getPrinterStatus, printTest, reprintOrder } from '../controllers/printerController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = Router();

// Proteger todas las rutas con autenticacion
router.use(verificarToken);

/**
 * @swagger
 * /api/printer/status:
 *   get:
 *     summary: Verifica el estado de la impresora
 *     tags: [Printer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado de la impresora
 */
router.get('/status', getPrinterStatus);

/**
 * @swagger
 * /api/printer/test:
 *   post:
 *     summary: Imprime un ticket de prueba
 *     tags: [Printer]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ticket de prueba impreso
 *       503:
 *         description: Impresora no disponible
 */
router.post('/test', printTest);

/**
 * @swagger
 * /api/printer/order/{orderId}:
 *   post:
 *     summary: Reimprime el ticket de una orden
 *     tags: [Printer]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: categoria
 *         schema:
 *           type: string
 *           enum: [churros, otros, all]
 *           default: all
 *     responses:
 *       200:
 *         description: Ticket reimpreso
 *       503:
 *         description: Impresora no disponible
 */
router.post('/order/:orderId', reprintOrder);

export default router;
