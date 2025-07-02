export const tieneRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    const rolActual = req.user?.rol ?? req.user?.role_id;

    if (!rolesPermitidos.includes(rolActual)) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    }
    next();
  };
};
