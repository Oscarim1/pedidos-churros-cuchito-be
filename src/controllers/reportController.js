import * as reportService from '../services/reportService.js';

export const getVentas = async (req, res) => {
  const { fechaInicio, fechaFin } = req.query;
  if (!fechaInicio || !fechaFin) {
    return res.status(400).json({ message: 'fechaInicio and fechaFin are required' });
  }
  try {
    const ventas = await reportService.getVentasPorRango(fechaInicio, fechaFin);
    res.json(ventas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
