import express from 'express';
import {
  // Ubicaciones
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  // Stock
  getAllStock,
  getStockByLocation,
  getStockByProduct,
  setMinQuantity,
  // Movimientos
  registerPurchase,
  registerRestock,
  registerSale,
  registerEmployeeConsumption,
  registerAdjustment,
  registerWaste,
  // Reportes
  getMovements,
  getStockSummary,
  getMovementsSummary,
  getEmployeeConsumptionReport,
  getProductMovementHistory
} from '../controllers/stockController.js';
import { verificarToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verificarToken);

// ============================================================
// UBICACIONES
// ============================================================
router.get('/locations', getLocations);
router.get('/locations/:id', getLocation);
router.post('/locations', createLocation);
router.put('/locations/:id', updateLocation);

// ============================================================
// STOCK
// ============================================================
router.get('/', getAllStock);
router.get('/location/:locationId', getStockByLocation);
router.get('/product/:productId', getStockByProduct);
router.post('/min-quantity', setMinQuantity);

// ============================================================
// MOVIMIENTOS
// ============================================================
router.post('/movements/purchase', registerPurchase);       // Compra a proveedor
router.post('/movements/restock', registerRestock);         // Reposición bodega -> máquina
router.post('/movements/sale', registerSale);               // Venta
router.post('/movements/employee', registerEmployeeConsumption); // Consumo empleado
router.post('/movements/adjustment', registerAdjustment);   // Ajuste manual
router.post('/movements/waste', registerWaste);             // Merma

// ============================================================
// REPORTES
// ============================================================
router.get('/movements', getMovements);
router.get('/summary', getStockSummary);
router.get('/movements/summary', getMovementsSummary);
router.get('/reports/employee-consumption', getEmployeeConsumptionReport);
router.get('/product/:productId/history', getProductMovementHistory);

export default router;
