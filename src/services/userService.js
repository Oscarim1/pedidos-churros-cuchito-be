const userModel = require('../models/userModel');
const bcrypt = require('bcrypt');

exports.listUsers = async () => userModel.getAll();

exports.getUser = async (id) => userModel.getById(id);

exports.createUser = async ({ username, email, password, role_id }) => {
  const password_hash = await bcrypt.hash(password, 10);
  return userModel.create({ username, email, password_hash, role_id });
};

exports.updateUser = async (id, { username, email, role_id }) => {
  return userModel.update(id, { username, email, role_id });
};

exports.deleteUser = async (id) => userModel.softDelete(id);
