import * as orderItemService from '../services/orderItemService.js';

export const getOrderItems = async (req, res) => {
  try {
    const items = await orderItemService.getAllOrderItems();
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOrderItemById = async (req, res) => {
  const { id } = req.params;
  try {
    const item = await orderItemService.getOrderItemById(id);
    if (!item) return res.status(404).json({ message: 'Order item not found' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createOrderItem = async (req, res) => {
  const { order_id, product_id, quantity, price, is_active } = req.body;
  if (!order_id || !product_id || price == null || quantity == null)
    return res.status(400).json({ message: 'order_id, product_id, quantity and price are required' });
  try {
    const item = await orderItemService.createOrderItem({ order_id, product_id, quantity, price, is_active });
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateOrderItem = async (req, res) => {
  const { id } = req.params;
  const { order_id, product_id, quantity, price, is_active } = req.body;
  try {
    const updated = await orderItemService.updateOrderItem(id, { order_id, product_id, quantity, price, is_active });
    if (!updated) return res.status(404).json({ message: 'Order item not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteOrderItem = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await orderItemService.deleteOrderItem(id);
    if (!deleted) return res.status(404).json({ message: 'Order item not found' });
    res.json({ message: 'Order item deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
