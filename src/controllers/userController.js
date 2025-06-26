const userService = require('../services/userService');
const { validationResult } = require('express-validator');

exports.listUsers = async (req, res) => {
  const users = await userService.listUsers();
  res.json(users);
};

exports.getUser = async (req, res) => {
  const user = await userService.getUser(req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  res.json(user);
};

exports.createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const id = await userService.createUser(req.body);
  res.status(201).json({ id });
};

exports.updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const affected = await userService.updateUser(req.params.id, req.body);
  if (!affected) return res.status(404).json({ message: 'Usuario no encontrado' });
  res.json({ message: 'Usuario actualizado' });
};

exports.deleteUser = async (req, res) => {
  const affected = await userService.deleteUser(req.params.id);
  if (!affected) return res.status(404).json({ message: 'Usuario no encontrado' });
  res.json({ message: 'Usuario eliminado' });
};
