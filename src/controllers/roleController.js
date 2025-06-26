const roleService = require('../services/roleService');
const { validationResult } = require('express-validator');

exports.listRoles = async (req, res) => {
  const roles = await roleService.listRoles();
  res.json(roles);
};

exports.getRole = async (req, res) => {
  const role = await roleService.getRole(req.params.id);
  if (!role) return res.status(404).json({ message: 'Rol no encontrado' });
  res.json(role);
};

exports.createRole = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const id = await roleService.createRole(req.body);
  res.status(201).json({ id });
};

exports.updateRole = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const affected = await roleService.updateRole(req.params.id, req.body);
  if (!affected) return res.status(404).json({ message: 'Rol no encontrado' });
  res.json({ message: 'Rol actualizado' });
};

exports.deleteRole = async (req, res) => {
  const affected = await roleService.deleteRole(req.params.id);
  if (!affected) return res.status(404).json({ message: 'Rol no encontrado' });
  res.json({ message: 'Rol eliminado' });
};
