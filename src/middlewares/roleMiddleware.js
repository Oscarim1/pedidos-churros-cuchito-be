export const tieneRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    const { rol } = req.user;

    if (!rolesPermitidos.includes(rol)) {
      return res.status(403).json({ message: 'No tienes permiso para realizar esta acción' });
    }
    next();
  };
};
