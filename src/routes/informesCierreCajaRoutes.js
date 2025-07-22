import express from 'express';
import {
  getInformesCierreCaja,
  getInformeCierreCajaById,
  createInformeCierreCaja,
  updateInformeCierreCaja,
  deleteInformeCierreCaja
} from '../controllers/informesCierreCajaController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verificarToken);

router.get('/', getInformesCierreCaja);
router.get('/:id', getInformeCierreCajaById);
router.post('/', createInformeCierreCaja);
router.put('/:id', updateInformeCierreCaja);
router.delete('/:id', deleteInformeCierreCaja);

export default router;
