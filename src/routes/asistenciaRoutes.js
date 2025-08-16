import express from 'express';
import {
  getAsistencia,
  createAsistencia,
  updateAsistencia,
  getAsistenciaByDate,
  getAsistenciaById
} from '../controllers/asistenciaController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verificarToken);

router.get('/', getAsistencia);
router.get('/:fecha/:usuario_id', getAsistenciaByDate);
router.get('/:id', getAsistenciaById);
router.post('/', createAsistencia);
router.put('/usuario/:usuario_id', updateAsistencia);

export default router;
