import express from 'express';
import {
  getCierresCaja,
  getCierreCajaById,
  createCierreCaja,
  updateCierreCaja,
  deleteCierreCaja
} from '../controllers/cierreCajaController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verificarToken);

router.get('/', getCierresCaja);
router.get('/:id', getCierreCajaById);
router.post('/', createCierreCaja);
router.put('/:id', updateCierreCaja);
router.delete('/:id', deleteCierreCaja);

export default router;
