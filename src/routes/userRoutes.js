import express from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { tieneRol } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(verificarToken);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', tieneRol('admin'), createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
