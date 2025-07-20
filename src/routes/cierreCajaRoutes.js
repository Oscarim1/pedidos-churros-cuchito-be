import express from 'express';
import {
  getCierresCaja,
  getCierreCajaById,
  createCierreCaja,
  updateCierreCaja,
  deleteCierreCaja,
  generateCierreCaja
} from '../controllers/cierreCajaController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verificarToken);

router.get('/', getCierresCaja);
router.get('/:id', getCierreCajaById);
router.post('/', createCierreCaja);
router.post('/generar', generateCierreCaja);
router.put('/:id', updateCierreCaja);
router.delete('/:id', deleteCierreCaja);

export default router;
