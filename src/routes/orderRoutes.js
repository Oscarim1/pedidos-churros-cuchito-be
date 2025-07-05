import express from 'express';
import {
  getOrders,
  getOrderById,
  downloadOrderPDF,
  createOrder,
  updateOrder,
  deleteOrder
} from '../controllers/orderController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verificarToken);

router.get('/', getOrders);
router.get('/:orderId/pdf', downloadOrderPDF);
router.get('/:id', getOrderById);
router.post('/', createOrder);
router.put('/:id', updateOrder);
router.delete('/:id', deleteOrder);

export default router;
