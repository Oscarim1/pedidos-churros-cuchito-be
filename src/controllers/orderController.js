import * as orderService from '../services/orderService.js';

export const getOrders = async (req, res) => {
  try {
    const orders = await orderService.getAllOrders();
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await orderService.getOrderById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createOrder = async (req, res) => {
  const { user_id, guest_name, total, points_used, points_earned, metodo_pago, status, order_number, is_active } = req.body;
  if (total == null) return res.status(400).json({ message: 'total is required' });
  try {
    const order = await orderService.createOrder({ user_id, guest_name, total, points_used, points_earned, metodo_pago, status, order_number, is_active });
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateOrder = async (req, res) => {
  const { id } = req.params;
  const { user_id, guest_name, total, points_used, points_earned, metodo_pago, status, order_number, is_active } = req.body;
  try {
    const updated = await orderService.updateOrder(id, { user_id, guest_name, total, points_used, points_earned, metodo_pago, status, order_number, is_active });
    if (!updated) return res.status(404).json({ message: 'Order not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await orderService.deleteOrder(id);
    if (!deleted) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
