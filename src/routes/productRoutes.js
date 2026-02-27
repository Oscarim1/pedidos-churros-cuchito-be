import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';
import { tieneRol } from '../middlewares/roleMiddleware.js';

const router = express.Router();

router.use(verificarToken);

// Consultas (cualquier usuario autenticado)
router.get('/', getProducts);
router.get('/:id', getProductById);

// Modificaciones (solo admin)
router.post('/', tieneRol('admin'), createProduct);
router.put('/:id', tieneRol('admin'), updateProduct);
router.delete('/:id', tieneRol('admin'), deleteProduct);

export default router;
