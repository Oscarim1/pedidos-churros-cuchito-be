import * as orderService from '../services/orderService.js';
import PDFDocument from 'pdfkit';
import path from 'path';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import archiver from 'archiver';
import { generateOrderPDF } from '../utils/pdfGenerator.js';

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


export const downloadOrderPDF = async (req, res) => {
  const { orderId } = req.params;
  let { type } = req.query;
  type = type ? type.toLowerCase() : '';

  try {
    const order = await orderService.getOrderWithItems(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Normaliza la lista de items
    const items = order.items || order.order_items || [];
    const churrosItems = items.filter(
      i => (i.products?.category || i.category || '').toLowerCase() === 'churros'
    );
    const otrosItems = items.filter(
      i => (i.products?.category || i.category || '').toLowerCase() !== 'churros'
    );

    // Genera y envía sólo churros
    if (type === 'churros') {
      if (!churrosItems.length) {
        return res
          .status(404)
          .json({ message: 'No hay productos en la categoría "Churros".' });
      }
      const pdfBuffer = await generateOrderPDF({
        order,
        items: churrosItems,
        title: 'CHURROS'
      });
      res
        .set('Content-Type', 'application/pdf')
        .set(
          'Content-Disposition',
          `attachment; filename=pedido_${order.order_number}_churros.pdf`
        )
        .send(pdfBuffer);
      return;
    }

    // Genera y envía sólo otros productos
    if (type === 'otros') {
      if (!otrosItems.length) {
        return res
          .status(404)
          .json({ message: 'No hay productos en la categoría "Otros".' });
      }
      const pdfBuffer = await generateOrderPDF({
        order,
        items: otrosItems,
        title: 'OTROS PRODUCTOS'
      });
      res
        .set('Content-Type', 'application/pdf')
        .set(
          'Content-Disposition',
          `attachment; filename=pedido_${order.order_number}_otros.pdf`
        )
        .send(pdfBuffer);
      return;
    }

    // Sin parámetro válido
    return res
      .status(400)
      .json({ message: 'Falta el parámetro type=churros|otros' });
  } catch (err) {
    console.error('Error generating PDF', err);
    return res.status(500).json({ message: 'Server error' });
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
