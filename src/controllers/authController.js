import bcrypt from 'bcrypt';
import * as authService from '../services/authservice.js';

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await authService.findUserByEmail(email);
    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ message: 'Contraseña incorrecta' });

    const accessToken = authService.generarAccessToken({ id: user.id, role_id: user.role_id });
    const refreshToken = authService.generarRefreshToken({ id: user.id });
    await authService.saveRefreshToken(user.id, refreshToken);

    res.json({
      accessToken,
      refreshToken,
      usuario: { id: user.id, username: user.username, role_id: user.role_id }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

export const register = async (req, res) => {
  const { username, email, password, role_id } = req.body;
  if (!username || !email || !password || !role_id)
    return res.status(400).json({ message: 'Todos los campos son obligatorios' });

  try {
    const existe = await authService.findUserByEmail(email);
    if (existe)
      return res.status(409).json({ message: 'El correo ya está registrado' });

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await authService.createUser({ username, email, passwordHash, role_id });

    const accessToken = authService.generarAccessToken({ id: userId, role_id });
    const refreshToken = authService.generarRefreshToken({ id: userId });
    await authService.saveRefreshToken(userId, refreshToken);

    res.status(201).json({
      accessToken,
      refreshToken,
      usuario: { id: userId, username, email, role_id }
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
    const tokenRow = await authService.findRefreshToken(refreshToken, decoded.id);
    if (!tokenRow)
      return res.status(403).json({ message: 'Refresh token inválido, revocado o expirado' });

    const user = await authService.findUserByEmail(tokenRow.email);
    // OJO: si necesitas el rol, puede que necesites una función para obtener el usuario por id
    const accessToken = authService.generarAccessToken({ id: decoded.id, role_id: user?.role_id });
    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(403).json({ message: 'Refresh token inválido o expirado' });
  }
};

export const logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'Refresh token requerido' });

  await authService.logout(refreshToken);
  res.json({ message: 'Sesión cerrada exitosamente' });
};
