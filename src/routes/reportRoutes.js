import express from 'express';
import { getVentas } from '../controllers/reportController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verificarToken);

router.get('/ventas', getVentas);

export default router;
