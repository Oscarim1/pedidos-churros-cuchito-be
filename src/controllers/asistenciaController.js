import * as asistenciaService from '../services/asistenciaService.js';

const columnasValidas = ['horario_entrada', 'horario_salida', 'horario_inicio_colacion', 'horario_fin_colacion'];

function esFechaValida(fecha) {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha);
}

export const getAsistencia = async (req, res) => {
  try {
    const asistencia = await asistenciaService.getAllAsistencias();
    res.json(asistencia);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAsistenciaById = async (req, res) => {
  const { id } = req.params;
  try {
    const asistencia = await asistenciaService.getAsistenciaById(id);
    if (!asistencia) return res.status(404).json({ message: 'No se encontró la asistencia para ese id' });
    res.json(asistencia);
  }
  catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAsistenciaByDate = async (req, res) => {
  const { fecha } = req.params;

  if (!esFechaValida(fecha)) {
  return res.status(400).json({ message: 'Formato de fecha inválido. Debe ser YYYY-MM-DD' });
  }

  try {
    const asistencia = await asistenciaService.getAsistenciaByDate(fecha);
    if (!asistencia) return res.status(404).json({ message: 'No se encontró la asistencia para esa fecha' });
    res.json(asistencia);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createAsistencia = async (req, res) => {
  const { usuario_id, tipo } = req.body;

  if (!columnasValidas.includes(tipo)) {
    return res.status(400).json({ message: 'Tipo de asistencia inválido' });
  }

  try {
    const nuevaAsistencia = await asistenciaService.createAsistencia({ usuario_id, tipo });
    res.status(201).json(nuevaAsistencia);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateAsistencia = async (req, res) => {
  const { tipo } = req.body;
  const { fecha } = req.params;

  if (!esFechaValida(fecha)) {
  return res.status(400).json({ message: 'Formato de fecha inválido. Debe ser YYYY-MM-DD' });
  }


  if (!columnasValidas.includes(tipo)) {
    return res.status(400).json({ message: 'Tipo de asistencia inválido' });
  }

  try {
    const asistenciaExistente = await asistenciaService.getAsistenciaByDate(fecha);
    if (!asistenciaExistente) {
      return res.status(404).json({ message: 'No se encontró la asistencia para esa fecha' });
    }

    const asistenciaActualizada = await asistenciaService.updateAsistencia(asistenciaExistente.id, tipo);
    res.json(asistenciaActualizada);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}