import * as orderService from '../services/orderService.js';
import puppeteer from 'puppeteer';

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
  try {
    const order = await orderService.getOrderWithItems(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const churros = [];
    const others = [];
    for (const item of order.items) {
      const subtotal = item.price * item.quantity;
      const entry = { name: item.name, quantity: item.quantity, subtotal };
      if ((item.category || '').toLowerCase() === 'churros') {
        churros.push(entry);
      } else {
        others.push(entry);
      }
    }

    const formatRows = rows =>
      rows
        .map(r => `<tr><td>${r.name}</td><td>${r.quantity}</td><td>$${r.subtotal.toFixed(2)}</td></tr>`) // string
        .join('');

    const html = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { text-align:center; }
          table { width:100%; border-collapse: collapse; margin-bottom:20px; }
          th, td { border: 1px solid #000; padding: 4px; text-align:left; }
          h2 { background:#eee; padding:4px; }
        </style>
      </head>
      <body>
        <h1>PEDIDO #${orderId}</h1>
        <p>Fecha: ${new Date(order.created_at).toLocaleString()}</p>
        <h2>CHURROS</h2>
        <table>
          <tr><th>Producto</th><th>Cantidad</th><th>Subtotal</th></tr>
          ${formatRows(churros)}
        </table>
        <h2>OTROS</h2>
        <table>
          <tr><th>Producto</th><th>Cantidad</th><th>Subtotal</th></tr>
          ${formatRows(others)}
        </table>
        <h2>Total: $${order.total.toFixed(2)}</h2>
      </body>
      </html>`;

    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=order_${orderId}.pdf`);
    res.send(pdfBuffer);
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
