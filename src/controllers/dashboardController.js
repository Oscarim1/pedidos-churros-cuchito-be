import * as dashboardService from '../services/dashboardService.js';

// ============================================================================
// VALIDACIÓN
// ============================================================================

const VALID_PERIODS = ['day', 'week', 'month'];
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valida formato de fecha YYYY-MM-DD y que sea una fecha válida
 */
function isValidDate(dateStr) {
  if (!DATE_REGEX.test(dateStr)) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD (zona horaria local)
 */
function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ============================================================================
// CONTROLLER
// ============================================================================

/**
 * GET /api/dashboard
 *
 * Query params:
 * - period: 'day' | 'week' | 'month' (obligatorio)
 * - date: 'YYYY-MM-DD' (opcional, default: hoy)
 * - from: 'YYYY-MM-DD' (opcional)
 * - to: 'YYYY-MM-DD' (opcional)
 *
 * Si from/to vienen, se usan como rango explícito.
 * Si no, se calcula según period y date.
 */
export const getDashboard = async (req, res) => {
  try {
    const { period, date, from, to } = req.query;

    // Validar period (obligatorio)
    if (!period) {
      return res.status(400).json({
        error: 'MISSING_PERIOD',
        message: 'El parámetro "period" es obligatorio. Valores válidos: day, week, month'
      });
    }

    if (!VALID_PERIODS.includes(period)) {
      return res.status(400).json({
        error: 'INVALID_PERIOD',
        message: `El parámetro "period" debe ser uno de: ${VALID_PERIODS.join(', ')}`
      });
    }

    // Validar date si viene
    const baseDate = date || getTodayDate();
    if (date && !isValidDate(date)) {
      return res.status(400).json({
        error: 'INVALID_DATE',
        message: 'El parámetro "date" debe tener formato YYYY-MM-DD y ser una fecha válida'
      });
    }

    // Validar from/to si vienen
    if (from && !isValidDate(from)) {
      return res.status(400).json({
        error: 'INVALID_FROM_DATE',
        message: 'El parámetro "from" debe tener formato YYYY-MM-DD y ser una fecha válida'
      });
    }

    if (to && !isValidDate(to)) {
      return res.status(400).json({
        error: 'INVALID_TO_DATE',
        message: 'El parámetro "to" debe tener formato YYYY-MM-DD y ser una fecha válida'
      });
    }

    // Si viene uno de from/to, deben venir ambos
    if ((from && !to) || (!from && to)) {
      return res.status(400).json({
        error: 'INCOMPLETE_RANGE',
        message: 'Si se especifica "from", también debe especificarse "to" y viceversa'
      });
    }

    // Validar que from <= to
    if (from && to && from > to) {
      return res.status(400).json({
        error: 'INVALID_RANGE',
        message: 'El parámetro "from" debe ser menor o igual a "to"'
      });
    }

    // Calcular rango de fechas
    const dateRange = dashboardService.calculateDateRange(
      period,
      baseDate,
      from || null,
      to || null
    );

    // Obtener datos del dashboard
    const dashboardData = await dashboardService.getDashboardData(
      period,
      dateRange.from,
      dateRange.to
    );

    res.json(dashboardData);

  } catch (err) {
    console.error('Error en getDashboard:', err);
    res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Error interno del servidor'
    });
  }
};
