import express from 'express';
import {
  getAsistencia,
  createAsistencia,
  updateAsistencia,
  getAsistenciaByDate,
  getAsistenciaById
} from '../controllers/asistenciaController.js';
import { verificarToken, soloAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verificarToken);

// Consultas (cualquier usuario autenticado puede ver)
router.get('/', getAsistencia);
router.get('/:fecha/:usuario_id', getAsistenciaByDate);
router.get('/:id', getAsistenciaById);

// Modificaciones (solo admin puede marcar asistencia)
router.post('/', soloAdmin, createAsistencia);
router.put('/usuario/:usuario_id', soloAdmin, updateAsistencia);

export default router;
