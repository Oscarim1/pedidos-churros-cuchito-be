import * as printService from '../services/printService.js';

/**
 * GET /api/printer/status
 * Verifica si la impresora esta conectada
 */
export const getPrinterStatus = async (req, res) => {
  try {
    const isConnected = await printService.isPrinterConnected();
    res.json({
      connected: isConnected,
      message: isConnected ? 'Impresora conectada' : 'Impresora no encontrada'
    });
  } catch (err) {
    console.error('[PrinterController] Error:', err);
    res.status(500).json({ message: 'Error verificando impresora' });
  }
};

/**
 * POST /api/printer/test
 * Imprime un ticket de prueba
 */
export const printTest = async (req, res) => {
  try {
    const result = await printService.printTestTicket();
    if (result.success) {
      res.json(result);
    } else {
      res.status(503).json(result);
    }
  } catch (err) {
    console.error('[PrinterController] Error:', err);
    res.status(500).json({ message: 'Error imprimiendo ticket de prueba' });
  }
};

/**
 * POST /api/printer/order/:orderId
 * Reimprime el ticket de una orden especifica
 * Query params:
 *   - categoria: 'churros' | 'otros' | 'all' (default: 'all')
 */
export const reprintOrder = async (req, res) => {
  const { orderId } = req.params;
  const categoria = (req.query.categoria || 'all').toLowerCase();

  if (!['churros', 'otros', 'all'].includes(categoria)) {
    return res.status(400).json({ message: 'Categoria invalida. Use: churros, otros, all' });
  }

  try {
    let result;
    if (categoria === 'all') {
      result = await printService.printOrderByCategory(orderId);
    } else {
      result = await printService.printOrderTicket(orderId, categoria);
    }

    const hasSuccess = Array.isArray(result)
      ? result.some(r => r.success)
      : result.success;

    if (hasSuccess) {
      res.json({ success: true, details: result });
    } else {
      res.status(503).json({ success: false, details: result });
    }
  } catch (err) {
    console.error('[PrinterController] Error:', err);
    res.status(500).json({ message: 'Error reimprimiendo orden' });
  }
};
