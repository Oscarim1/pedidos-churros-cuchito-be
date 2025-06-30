export const tieneRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    // El token puede incluir la propiedad `rol` (nombre del rol) o `role_id`.
    const rolActual = req.user?.rol ?? req.user?.role_id;

    if (!rolesPermitidos.includes(rolActual)) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    }
    next();
  };
};
