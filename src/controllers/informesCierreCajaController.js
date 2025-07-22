import * as informeService from '../services/informesCierreCajaService.js';

export const getInformesCierreCaja = async (req, res) => {
  try {
    const informes = await informeService.getAllInformesCierreCaja();
    res.json(informes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getInformeCierreCajaById = async (req, res) => {
  const { id } = req.params;
  try {
    const informe = await informeService.getInformeCierreCajaById(id);
    if (!informe) return res.status(404).json({ message: 'Informe not found' });
    res.json(informe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createInformeCierreCaja = async (req, res) => {
  const { monto_declarado_efectivo, monto_declarado_tarjeta, monto_declarado_pedidos_ya, fecha, cierre_caja_id } = req.body;
  if (
    monto_declarado_efectivo == null ||
    monto_declarado_tarjeta == null ||
    monto_declarado_pedidos_ya == null ||
    !fecha ||
    !cierre_caja_id
  ) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  try {
    const informe = await informeService.createInformeCierreCaja({
      monto_declarado_efectivo,
      monto_declarado_tarjeta,
      monto_declarado_pedidos_ya,
      fecha,
      cierre_caja_id
    });
    res.status(201).json(informe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateInformeCierreCaja = async (req, res) => {
  const { id } = req.params;
  const { monto_declarado_efectivo, monto_declarado_tarjeta, monto_declarado_pedidos_ya, fecha, cierre_caja_id } = req.body;
  try {
    const updated = await informeService.updateInformeCierreCaja(id, {
      monto_declarado_efectivo,
      monto_declarado_tarjeta,
      monto_declarado_pedidos_ya,
      fecha,
      cierre_caja_id
    });
    if (!updated) return res.status(404).json({ message: 'Informe not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteInformeCierreCaja = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await informeService.deleteInformeCierreCaja(id);
    if (!deleted) return res.status(404).json({ message: 'Informe not found' });
    res.json({ message: 'Informe deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
