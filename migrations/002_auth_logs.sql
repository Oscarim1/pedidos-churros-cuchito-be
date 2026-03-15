-- Migración: Sistema de logs de autenticación
-- Fecha: 2024
-- Descripción: Tabla para auditoría de accesos al sistema

CREATE TABLE IF NOT EXISTS auth_logs (
  id CHAR(36) NOT NULL DEFAULT (UUID()),
  user_id CHAR(36) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  event_type ENUM(
    'login_success',
    'login_failed',
    'logout',
    'refresh_token',
    'register'
  ) NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT,
  device_type VARCHAR(20) DEFAULT NULL,
  os_name VARCHAR(50) DEFAULT NULL,
  os_version VARCHAR(20) DEFAULT NULL,
  browser_name VARCHAR(50) DEFAULT NULL,
  browser_version VARCHAR(20) DEFAULT NULL,
  failure_reason VARCHAR(255) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_auth_logs_user_id (user_id),
  INDEX idx_auth_logs_email (email),
  INDEX idx_auth_logs_event_type (event_type),
  INDEX idx_auth_logs_ip (ip_address),
  INDEX idx_auth_logs_created_at (created_at),
  CONSTRAINT fk_auth_logs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Vista para consultas rápidas de accesos sospechosos
CREATE OR REPLACE VIEW v_login_summary AS
SELECT
  al.user_id,
  u.username,
  u.email,
  al.ip_address,
  al.device_type,
  CONCAT(al.os_name, ' ', al.os_version) AS sistema_operativo,
  CONCAT(al.browser_name, ' ', al.browser_version) AS navegador,
  al.event_type,
  al.failure_reason,
  al.created_at
FROM auth_logs al
LEFT JOIN users u ON al.user_id = u.id
ORDER BY al.created_at DESC;

-- Vista para detectar IPs únicas por usuario
CREATE OR REPLACE VIEW v_user_ips AS
SELECT
  user_id,
  email,
  ip_address,
  COUNT(*) as access_count,
  MAX(created_at) as last_access,
  MIN(created_at) as first_access
FROM auth_logs
WHERE event_type = 'login_success'
GROUP BY user_id, email, ip_address
ORDER BY last_access DESC;
