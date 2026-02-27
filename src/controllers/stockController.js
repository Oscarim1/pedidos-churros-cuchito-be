import * as stockService from '../services/stockService.js';

// ============================================================
// UBICACIONES
// ============================================================

export const getLocations = async (req, res) => {
  try {
    const locations = await stockService.getAllLocations();
    res.json(locations);
  } catch (err) {
    console.error('Error getting locations:', err);
    res.status(500).json({ message: 'Error al obtener ubicaciones' });
  }
};

export const getLocation = async (req, res) => {
  try {
    const location = await stockService.getLocationById(req.params.id);
    if (!location) {
      return res.status(404).json({ message: 'Ubicación no encontrada' });
    }
    res.json(location);
  } catch (err) {
    console.error('Error getting location:', err);
    res.status(500).json({ message: 'Error al obtener ubicación' });
  }
};

export const createLocation = async (req, res) => {
  const { name, type } = req.body;
  if (!name || !type) {
    return res.status(400).json({ message: 'name y type son requeridos' });
  }
  try {
    const location = await stockService.createLocation({ name, type });
    res.status(201).json(location);
  } catch (err) {
    console.error('Error creating location:', err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Ya existe una ubicación con ese nombre' });
    }
    res.status(500).json({ message: 'Error al crear ubicación' });
  }
};

export const updateLocation = async (req, res) => {
  const { name, type, is_active } = req.body;
  try {
    const location = await stockService.updateLocation(req.params.id, { name, type, is_active });
    if (!location) {
      return res.status(404).json({ message: 'Ubicación no encontrada' });
    }
    res.json(location);
  } catch (err) {
    console.error('Error updating location:', err);
    res.status(500).json({ message: 'Error al actualizar ubicación' });
  }
};

// ============================================================
// STOCK
// ============================================================

export const getAllStock = async (req, res) => {
  try {
    const stock = await stockService.getAllStock();
    res.json(stock);
  } catch (err) {
    console.error('Error getting stock:', err);
    res.status(500).json({ message: 'Error al obtener stock' });
  }
};

export const getStockByLocation = async (req, res) => {
  try {
    const stock = await stockService.getStockByLocation(req.params.locationId);
    res.json(stock);
  } catch (err) {
    console.error('Error getting stock by location:', err);
    res.status(500).json({ message: 'Error al obtener stock por ubicación' });
  }
};

export const getStockByProduct = async (req, res) => {
  try {
    const stock = await stockService.getStockByProduct(req.params.productId);
    res.json(stock);
  } catch (err) {
    console.error('Error getting stock by product:', err);
    res.status(500).json({ message: 'Error al obtener stock por producto' });
  }
};

export const setMinQuantity = async (req, res) => {
  const { product_id, location_id, min_quantity } = req.body;
  if (!product_id || !location_id || min_quantity == null) {
    return res.status(400).json({ message: 'product_id, location_id y min_quantity son requeridos' });
  }
  try {
    const stock = await stockService.setMinQuantity(product_id, location_id, min_quantity);
    res.json(stock);
  } catch (err) {
    console.error('Error setting min quantity:', err);
    res.status(500).json({ message: 'Error al configurar cantidad mínima' });
  }
};

// ============================================================
// MOVIMIENTOS
// ============================================================

export const registerPurchase = async (req, res) => {
  const { product_id, location_id, quantity, notes } = req.body;
  const userId = req.user?.id;

  if (!product_id || !location_id || !quantity) {
    return res.status(400).json({ message: 'product_id, location_id y quantity son requeridos' });
  }
  if (quantity <= 0) {
    return res.status(400).json({ message: 'quantity debe ser mayor a 0' });
  }

  try {
    const movement = await stockService.registerPurchase({
      productId: product_id,
      locationId: location_id,
      quantity,
      userId,
      notes
    });
    res.status(201).json(movement);
  } catch (err) {
    console.error('Error registering purchase:', err);
    res.status(500).json({ message: 'Error al registrar compra' });
  }
};

export const registerRestock = async (req, res) => {
  const { product_id, from_location_id, to_location_id, quantity, notes } = req.body;
  const userId = req.user?.id;

  if (!product_id || !from_location_id || !to_location_id || !quantity) {
    return res.status(400).json({
      message: 'product_id, from_location_id, to_location_id y quantity son requeridos'
    });
  }
  if (quantity <= 0) {
    return res.status(400).json({ message: 'quantity debe ser mayor a 0' });
  }
  if (from_location_id === to_location_id) {
    return res.status(400).json({ message: 'Las ubicaciones de origen y destino deben ser diferentes' });
  }

  try {
    const movement = await stockService.registerRestock({
      productId: product_id,
      fromLocationId: from_location_id,
      toLocationId: to_location_id,
      quantity,
      userId,
      notes
    });
    res.status(201).json(movement);
  } catch (err) {
    console.error('Error registering restock:', err);
    if (err.message.includes('Stock insuficiente')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error al registrar reposición' });
  }
};

export const registerSale = async (req, res) => {
  const { product_id, location_id, quantity, order_id, notes } = req.body;
  const userId = req.user?.id;

  if (!product_id || !location_id || !quantity) {
    return res.status(400).json({ message: 'product_id, location_id y quantity son requeridos' });
  }
  if (quantity <= 0) {
    return res.status(400).json({ message: 'quantity debe ser mayor a 0' });
  }

  try {
    const movement = await stockService.registerSale({
      productId: product_id,
      locationId: location_id,
      quantity,
      userId,
      orderId: order_id,
      notes
    });
    res.status(201).json(movement);
  } catch (err) {
    console.error('Error registering sale:', err);
    if (err.message.includes('Stock insuficiente')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error al registrar venta' });
  }
};

export const registerEmployeeConsumption = async (req, res) => {
  const { product_id, location_id, quantity, employee_id, notes } = req.body;
  const userId = req.user?.id;

  if (!product_id || !location_id || !quantity || !employee_id) {
    return res.status(400).json({ message: 'product_id, location_id, quantity y employee_id son requeridos' });
  }
  if (quantity <= 0) {
    return res.status(400).json({ message: 'quantity debe ser mayor a 0' });
  }

  try {
    const movement = await stockService.registerEmployeeConsumption({
      productId: product_id,
      locationId: location_id,
      quantity,
      userId,
      employeeId: employee_id,
      notes
    });
    res.status(201).json(movement);
  } catch (err) {
    console.error('Error registering employee consumption:', err);
    if (err.message.includes('Stock insuficiente')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error al registrar consumo de empleado' });
  }
};

export const registerAdjustment = async (req, res) => {
  const { product_id, location_id, quantity, notes } = req.body;
  const userId = req.user?.id;

  if (!product_id || !location_id || quantity == null) {
    return res.status(400).json({ message: 'product_id, location_id y quantity son requeridos' });
  }
  if (quantity === 0) {
    return res.status(400).json({ message: 'quantity no puede ser 0' });
  }

  try {
    const movement = await stockService.registerAdjustment({
      productId: product_id,
      locationId: location_id,
      quantity,
      userId,
      notes
    });
    res.status(201).json(movement);
  } catch (err) {
    console.error('Error registering adjustment:', err);
    if (err.message.includes('Stock insuficiente')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error al registrar ajuste' });
  }
};

export const registerWaste = async (req, res) => {
  const { product_id, location_id, quantity, notes } = req.body;
  const userId = req.user?.id;

  if (!product_id || !location_id || !quantity) {
    return res.status(400).json({ message: 'product_id, location_id y quantity son requeridos' });
  }
  if (quantity <= 0) {
    return res.status(400).json({ message: 'quantity debe ser mayor a 0' });
  }

  try {
    const movement = await stockService.registerWaste({
      productId: product_id,
      locationId: location_id,
      quantity,
      userId,
      notes
    });
    res.status(201).json(movement);
  } catch (err) {
    console.error('Error registering waste:', err);
    if (err.message.includes('Stock insuficiente')) {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error al registrar merma' });
  }
};

// ============================================================
// CONSULTAS Y REPORTES
// ============================================================

export const getMovements = async (req, res) => {
  const { product_id, location_id, type, start_date, end_date, limit } = req.query;

  try {
    const movements = await stockService.getMovements({
      productId: product_id,
      locationId: location_id,
      type,
      startDate: start_date,
      endDate: end_date,
      limit: limit ? parseInt(limit) : 100
    });
    res.json(movements);
  } catch (err) {
    console.error('Error getting movements:', err);
    res.status(500).json({ message: 'Error al obtener movimientos' });
  }
};

export const getStockSummary = async (req, res) => {
  try {
    const summary = await stockService.getStockSummary();
    res.json(summary);
  } catch (err) {
    console.error('Error getting stock summary:', err);
    res.status(500).json({ message: 'Error al obtener resumen de stock' });
  }
};

export const getMovementsSummary = async (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ message: 'start_date y end_date son requeridos' });
  }

  try {
    const summary = await stockService.getMovementsSummary({
      startDate: start_date,
      endDate: end_date
    });
    res.json(summary);
  } catch (err) {
    console.error('Error getting movements summary:', err);
    res.status(500).json({ message: 'Error al obtener resumen de movimientos' });
  }
};

export const getEmployeeConsumptionReport = async (req, res) => {
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ message: 'start_date y end_date son requeridos' });
  }

  try {
    const report = await stockService.getEmployeeConsumptionReport({
      startDate: start_date,
      endDate: end_date
    });
    res.json(report);
  } catch (err) {
    console.error('Error getting employee consumption report:', err);
    res.status(500).json({ message: 'Error al obtener reporte de consumo de empleados' });
  }
};

export const getProductMovementHistory = async (req, res) => {
  const { productId } = req.params;
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    return res.status(400).json({ message: 'start_date y end_date son requeridos' });
  }

  try {
    const history = await stockService.getProductMovementHistory(productId, {
      startDate: start_date,
      endDate: end_date
    });
    res.json(history);
  } catch (err) {
    console.error('Error getting product movement history:', err);
    res.status(500).json({ message: 'Error al obtener historial de movimientos del producto' });
  }
};
