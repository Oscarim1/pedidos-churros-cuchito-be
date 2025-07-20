import * as cierreCajaService from '../services/cierreCajaService.js';

export const getCierresCaja = async (req, res) => {
  try {
    const cierres = await cierreCajaService.getAllCierresCaja();
    res.json(cierres);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCierreCajaById = async (req, res) => {
  const { id } = req.params;
  try {
    const cierre = await cierreCajaService.getCierreCajaById(id);
    if (!cierre) return res.status(404).json({ message: 'Cierre de caja not found' });
    res.json(cierre);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createCierreCaja = async (req, res) => {
  const {
    fecha,
    total_efectivo,
    total_maquinas,
    maquina1,
    pedidos_ya,
    salidas_efectivo,
    ingresos_efectivo,
    usuario_id,
    observacion,
    total_pagos_tarjeta_web,
    is_active
  } = req.body;

  if (
    !fecha ||
    total_efectivo == null ||
    total_maquinas == null ||
    maquina1 == null ||
    pedidos_ya == null ||
    salidas_efectivo == null ||
    ingresos_efectivo == null ||
    !usuario_id ||
    total_pagos_tarjeta_web == null
  ) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const cierre = await cierreCajaService.createCierreCaja({
      fecha,
      total_efectivo,
      total_maquinas,
      maquina1,
      pedidos_ya,
      salidas_efectivo,
      ingresos_efectivo,
      usuario_id,
      observacion,
      total_pagos_tarjeta_web,
      is_active
    });
    res.status(201).json(cierre);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCierreCaja = async (req, res) => {
  const { id } = req.params;
  const {
    fecha,
    total_efectivo,
    total_maquinas,
    maquina1,
    pedidos_ya,
    salidas_efectivo,
    ingresos_efectivo,
    usuario_id,
    observacion,
    total_pagos_tarjeta_web,
    is_active
  } = req.body;
  try {
    const updated = await cierreCajaService.updateCierreCaja(id, {
      fecha,
      total_efectivo,
      total_maquinas,
      maquina1,
      pedidos_ya,
      salidas_efectivo,
      ingresos_efectivo,
      usuario_id,
      observacion,
      total_pagos_tarjeta_web,
      is_active
    });
    if (!updated) return res.status(404).json({ message: 'Cierre de caja not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCierreCaja = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await cierreCajaService.deleteCierreCaja(id);
    if (!deleted) return res.status(404).json({ message: 'Cierre de caja not found' });
    res.json({ message: 'Cierre de caja deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const generateCierreCaja = async (req, res) => {
  const {
    fecha,
    maquina1,
    pedidos_ya,
    salidas_efectivo,
    ingresos_efectivo,
    usuario_id,
    observacion,
    is_active
  } = req.body;

  if (!fecha || !usuario_id) {
    return res.status(400).json({ message: 'fecha and usuario_id are required' });
  }
  try {
    const cierre = await cierreCajaService.generateCierreCaja({
      fecha,
      maquina1,
      pedidos_ya,
      salidas_efectivo,
      ingresos_efectivo,
      usuario_id,
      observacion,
      is_active
    });
    res.status(201).json(cierre);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
