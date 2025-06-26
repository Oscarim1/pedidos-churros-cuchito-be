import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../config/db.js';

const generarAccessToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });

const generarRefreshToken = (payload) =>
  jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

export const login = async (req, res) => {
  const { correo, password } = req.body;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM usuarios WHERE correo = ? LIMIT 1',
      [correo]
    );

    if (rows.length === 0) return res.status(404).json({ message: 'Usuario no encontrado' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const accessToken = generarAccessToken({ id: user.id, rol: user.rol });
    const refreshToken = generarRefreshToken({ id: user.id });

    await pool.query(`
      INSERT INTO refresh_tokens (usuario_id, token, expira_en)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
    `, [user.id, refreshToken]);

    res.json({
      accessToken,
      refreshToken,
      usuario: { id: user.id, nombre: user.nombre, rol: user.rol }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const register = async (req, res) => {
  const { nombre, correo, password, rol } = req.body;

  if (!nombre || !correo || !password || !rol)
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });

  try {
    const [existe] = await pool.query('SELECT id FROM usuarios WHERE correo = ?', [correo]);
    if (existe.length > 0)
      return res.status(409).json({ message: 'El correo ya está registrado' });

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(`
      INSERT INTO usuarios (nombre, correo, password_hash, rol, creado_en, actualizado_en)
      VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [nombre, correo, passwordHash, rol]
    );

    const userId = result.insertId;
    const accessToken = generarAccessToken({ id: userId, rol });
    const refreshToken = generarRefreshToken({ id: userId });

    await pool.query(`
      INSERT INTO refresh_tokens (usuario_id, token, expira_en)
      VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
    `, [userId, refreshToken]);

    res.status(201).json({
      accessToken,
      refreshToken,
      usuario: { id: userId, nombre, correo, rol }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token requerido' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const [tokens] = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND usuario_id = ? AND revocado = 0',
      [refreshToken, decoded.id]
    );

    if (tokens.length === 0)
      return res.status(403).json({ message: 'Refresh token inválido o revocado' });

    const [[usuario]] = await pool.query('SELECT rol FROM usuarios WHERE id = ?', [decoded.id]);
    const nuevoAccessToken = generarAccessToken({ id: decoded.id, rol: usuario?.rol });
    res.json({ accessToken: nuevoAccessToken });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: 'Refresh token inválido o expirado' });
  }
};

export const logout = async (req, res) => {
  const { refreshToken } = req.body;
  await pool.query('UPDATE refresh_tokens SET revocado = 1 WHERE token = ?', [refreshToken]);
  res.json({ message: 'Sesión cerrada exitosamente' });
};

export const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token requerido' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
};
