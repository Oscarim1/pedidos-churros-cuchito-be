import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const UAParser = require('ua-parser-js');

/**
 * Parsea el User-Agent y extrae información del dispositivo
 * @param {string} userAgent - El User-Agent string del request
 * @returns {Object} Información parseada del dispositivo
 */
export function parseDevice(userAgent) {
  if (!userAgent) {
    return {
      deviceType: 'unknown',
      osName: 'unknown',
      osVersion: '',
      browserName: 'unknown',
      browserVersion: ''
    };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  return {
    deviceType: result.device.type || 'desktop',
    osName: result.os.name || 'unknown',
    osVersion: result.os.version || '',
    browserName: result.browser.name || 'unknown',
    browserVersion: result.browser.version || ''
  };
}

/**
 * Extrae la IP real del request (considerando proxies)
 * @param {Object} req - Express request object
 * @returns {string} IP address
 */
export function getClientIp(req) {
  // Orden de prioridad para obtener la IP real
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // x-forwarded-for puede tener múltiples IPs, la primera es el cliente
    return forwardedFor.split(',')[0].trim();
  }

  return req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
}

/**
 * Extrae toda la metadata del request para logging
 * @param {Object} req - Express request object
 * @returns {Object} Metadata completa
 */
export function extractRequestMetadata(req) {
  const userAgent = req.headers['user-agent'] || '';
  const deviceInfo = parseDevice(userAgent);
  const ipAddress = getClientIp(req);

  return {
    ipAddress,
    userAgent,
    ...deviceInfo
  };
}
