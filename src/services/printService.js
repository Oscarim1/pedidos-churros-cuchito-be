import ThermalPrinter from 'node-thermal-printer';
import { pool } from '../config/db.js';

const { printer: Printer, types: PrinterTypes } = ThermalPrinter;

// ============================================================================
// CONFIGURACION DE IMPRESORA
// ============================================================================

/**
 * Configuracion de la impresora termica
 * Ajusta estos valores segun tu impresora:
 * - interface: nombre de la impresora en el sistema o path
 *   - Windows: "\\\\localhost\\NombreImpresora" o "COM3"
 *   - macOS: "/dev/usb/lp0" o nombre de impresora
 *   - Linux: "/dev/usb/lp0"
 */
const PRINTER_CONFIG = {
  type: PrinterTypes.EPSON, // EPSON, STAR, DARUMA, etc.
  interface: process.env.PRINTER_INTERFACE || 'printer:POS-58',
  characterSet: 'LATINA',
  removeSpecialCharacters: false,
  lineCharacter: '-',
  width: 32, // 58mm = 32 caracteres
  options: {
    timeout: 5000
  }
};

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formatea numero a CLP
 */
function toCLP(n) {
  return '$' + Number(n).toLocaleString('es-CL', { minimumFractionDigits: 0 });
}

/**
 * Centra texto en el ancho dado
 */
function centerText(text, width = 32) {
  const padding = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(padding) + text;
}

/**
 * Trunca texto si excede el limite
 */
function truncate(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength - 1) + '.' : text;
}

// ============================================================================
// SERVICIO DE IMPRESION
// ============================================================================

/**
 * Crea una instancia de la impresora
 */
function createPrinter() {
  return new Printer(PRINTER_CONFIG);
}

/**
 * Verifica si la impresora esta conectada
 */
export async function isPrinterConnected() {
  const printer = createPrinter();
  try {
    const isConnected = await printer.isPrinterConnected();
    return isConnected;
  } catch (error) {
    console.error('[PrintService] Error verificando impresora:', error.message);
    return false;
  }
}

/**
 * Obtiene la orden con sus items para imprimir
 */
async function getOrderForPrint(orderId) {
  const [orderRows] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
  if (orderRows.length === 0) return null;

  const order = orderRows[0];
  const [items] = await pool.query(
    `SELECT oi.*, p.name, p.category
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ? AND oi.is_active = 1`,
    [orderId]
  );
  order.items = items;
  return order;
}

/**
 * Imprime el ticket de una orden
 * @param {string} orderId - ID de la orden a imprimir
 * @param {'churros'|'otros'|'all'} categoria - Categoria a imprimir
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function printOrderTicket(orderId, categoria = 'all') {
  const printer = createPrinter();

  try {
    // Verificar conexion
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      console.warn('[PrintService] Impresora no conectada, omitiendo impresion');
      return { success: false, message: 'Impresora no conectada' };
    }

    // Obtener orden con items
    const order = await getOrderForPrint(orderId);
    if (!order) {
      return { success: false, message: 'Orden no encontrada' };
    }

    // Filtrar items por categoria si es necesario
    let items = order.items;
    let categoryLabel = 'TICKET';

    if (categoria === 'churros') {
      items = order.items.filter(i => (i.category || '').toLowerCase() === 'churros');
      categoryLabel = 'CHURROS';
    } else if (categoria === 'otros') {
      items = order.items.filter(i => (i.category || '').toLowerCase() !== 'churros');
      categoryLabel = 'OTROS';
    }

    if (items.length === 0) {
      return { success: false, message: `No hay items en categoria ${categoria}` };
    }

    // Calcular total de la categoria
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Formatear fecha
    const fecha = new Date(order.created_at);
    const fechaStr = fecha.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaStr = fecha.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

    // =========================================
    // CONSTRUIR TICKET
    // =========================================

    printer.clear();

    // Encabezado
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println('CHURROS CUCHITO');
    printer.bold(false);
    printer.setTextNormal();
    printer.println('--------------------------------');

    // Numero de pedido
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println(`PEDIDO #${order.order_number}`);
    printer.setTextNormal();
    printer.bold(false);

    // Categoria (si aplica)
    if (categoria !== 'all') {
      printer.println(`[ ${categoryLabel} ]`);
    }

    printer.println(`${fechaStr} ${horaStr}`);
    printer.println('--------------------------------');

    // Items
    printer.alignLeft();
    for (const item of items) {
      const nombre = truncate(item.name, 24);
      const qty = item.quantity;
      const precio = toCLP(item.price * qty);

      // Linea 1: Cantidad x Nombre
      printer.bold(true);
      printer.println(`${qty}x ${nombre}`);
      printer.bold(false);

      // Linea 2: Precio alineado a la derecha
      printer.alignRight();
      printer.println(precio);
      printer.alignLeft();
    }

    printer.println('--------------------------------');

    // Total
    printer.alignRight();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println(`TOTAL: ${toCLP(total)}`);
    printer.setTextNormal();
    printer.bold(false);

    // Metodo de pago
    if (order.metodo_pago) {
      printer.alignCenter();
      printer.println(`(${order.metodo_pago.toUpperCase()})`);
    }

    printer.println('--------------------------------');

    // Pie
    printer.alignCenter();
    printer.println('Gracias por tu compra!');
    printer.println('');

    // Cortar papel (si la impresora lo soporta)
    printer.cut();

    // Ejecutar impresion
    await printer.execute();

    console.log(`[PrintService] Ticket impreso: Orden #${order.order_number} (${categoryLabel})`);
    return { success: true, message: 'Ticket impreso correctamente' };

  } catch (error) {
    console.error('[PrintService] Error imprimiendo ticket:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Imprime tickets separados por categoria (churros y otros)
 * Util para cocinas separadas
 */
export async function printOrderByCategory(orderId) {
  const results = [];

  // Imprimir ticket de churros
  const churrosResult = await printOrderTicket(orderId, 'churros');
  results.push({ categoria: 'churros', ...churrosResult });

  // Imprimir ticket de otros
  const otrosResult = await printOrderTicket(orderId, 'otros');
  results.push({ categoria: 'otros', ...otrosResult });

  return results;
}

/**
 * Imprime un ticket de prueba
 */
export async function printTestTicket() {
  const printer = createPrinter();

  try {
    const isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      return { success: false, message: 'Impresora no conectada' };
    }

    printer.clear();
    printer.alignCenter();
    printer.bold(true);
    printer.println('CHURROS CUCHITO');
    printer.bold(false);
    printer.println('--------------------------------');
    printer.println('TICKET DE PRUEBA');
    printer.println('');
    printer.println('La impresora esta');
    printer.println('funcionando correctamente');
    printer.println('');
    printer.println(new Date().toLocaleString('es-CL'));
    printer.println('--------------------------------');
    printer.cut();

    await printer.execute();

    return { success: true, message: 'Ticket de prueba impreso' };
  } catch (error) {
    console.error('[PrintService] Error en ticket de prueba:', error.message);
    return { success: false, message: error.message };
  }
}
