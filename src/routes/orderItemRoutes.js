import express from 'express';
import {
  getOrderItems,
  getOrderItemById,
  createOrderItem,
  updateOrderItem,
  deleteOrderItem
} from '../controllers/orderItemController.js';

const router = express.Router();

router.get('/', getOrderItems);
router.get('/:id', getOrderItemById);
router.post('/', createOrderItem);
router.put('/:id', updateOrderItem);
router.delete('/:id', deleteOrderItem);

export default router;
