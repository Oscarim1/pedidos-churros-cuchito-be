import * as orderService from '../services/orderService.js';
import * as cierreCajaService from '../services/cierreCajaService.js';
import * as printService from '../services/printService.js';
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

export const getTotalPorDia = async (req, res) => {
  const { fecha } = req.query;
  if (!fecha) return res.status(400).json({ message: 'fecha is required' });

  const exist = await cierreCajaService.getCierreCajaByDate(fecha);
      if (exist) return res.status(409).json({ message: 'Cierre de caja already exist' });

  try {
    const totals = await orderService.getTotalByDate(fecha);
    res.json(totals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const downloadOrderPDF = async (req, res) => {
  const { orderId } = req.params;
  const categoria = (req.query.categoria || '').toLowerCase(); // 'churros' o 'otros'

  try {
    const order = await orderService.getOrderWithItems(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    let items = [];
    let catName = '';
    if (categoria === 'churros') {
      items = order.items.filter(i => (i.category || '').toLowerCase() === 'churros');
      catName = 'CHURROS';
    } else if (categoria === 'otros') {
      items = order.items.filter(i => (i.category || '').toLowerCase() !== 'churros');
      catName = 'OTROS';
    } else {
      return res.status(400).json({ message: 'Categoría inválida (debe ser "churros" u "otros")' });
    }

    if (!items.length) {
      return res.status(404).json({ message: `No hay productos en la categoría "${catName}"` });
    }

    // Genera el PDF SOLO con la categoría seleccionada
    const makeHtmlBoleta = (order, categoria, items) => {
      const date = new Date(order.created_at).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
      const total = items.reduce((sum, it) => sum + (it.price * it.quantity), 0);
      const toCLP = n => '$' + Number(n).toLocaleString('es-CL', { minimumFractionDigits: 0 });
      const esc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g,'&gt;');

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Pedido #${order.id} - ${categoria}</title>
          <style>
            body { font-family: 'monospace', Arial, sans-serif; font-size: 17px; color: #1a1a1a; background: #fff; padding:0; margin:0;}
            .wrap { max-width:360px; margin:0 auto; background:#fff;}
            h1 { text-align:center; font-size:2.2em; margin:20px 0 6px 0; letter-spacing: 1px; }
            .fecha { text-align:center; font-size:1em; margin-bottom:14px; }
            .cat { font-size:1.1em; text-align:center; font-weight:bold; margin-top:10px; }
            .sep { text-align:center; margin:8px 0 12px 0; }
            .total { text-align:center; font-size:1.15em; font-weight:bold; margin:18px 0 4px 0; color:#e86a01;}
            .gracias { text-align:center; color:#555; font-size:.97em; margin:20px 0;}
          </style>
        </head>
        <body>
          <div class="wrap">
            <h1>PEDIDO #${order.order_number}</h1>
            <div class="fecha">Fecha: ${esc(date)}</div>
            <div class="cat">${categoria}</div>
            <div class="sep">********************</div>
            ${items.map(item => `
              <div style="margin: 0 0 18px 0;">
                <div style="text-align:center; font-size:1.12em; font-weight:bold; margin-bottom:2px;">
                  ${item.quantity}x ${esc(item.name)}
                </div>
                <div style="text-align:center; font-size:1em; color:#555;">${esc(item.description || '')}</div>
                <div style="text-align:right; font-size:1.15em; font-weight:bold; margin-top:3px;">
                  ${toCLP(item.price)}
                </div>
              </div>
            `).join('')}
            <div class="sep">********************</div>
            <div class="gracias">¡Gracias por tu compra!<br/>Churros Cuchito</div>
          </div>
        </body>
        </html>
        `;
    };

    const html = makeHtmlBoleta(order, catName, items);
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'], });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded' });
    const pdfBuffer = await page.pdf({
      format: 'A6',
      printBackground: true,
      margin: { top: 12, bottom: 12, left: 10, right: 10 }
    });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=pedido_${order.id}_${catName.toLowerCase()}.pdf`);
    res.send(pdfBuffer);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



export const createOrder = async (req, res) => {
  const { user_id, guest_name, total, points_used, points_earned, metodo_pago, status, order_number, is_active, auto_print } = req.body;
  if (total == null) return res.status(400).json({ message: 'total is required' });
  try {
    const order = await orderService.createOrder({ user_id, guest_name, total, points_used, points_earned, metodo_pago, status, order_number, is_active });

    // Impresion automatica (no bloquea la respuesta si falla)
    // Por defecto imprime, a menos que auto_print === false
    if (auto_print !== false) {
      printService.printOrderByCategory(order.id)
        .then(results => {
          console.log(`[Order ${order.order_number}] Impresion:`, results);
        })
        .catch(err => {
          console.error(`[Order ${order.order_number}] Error impresion:`, err.message);
        });
    }

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
