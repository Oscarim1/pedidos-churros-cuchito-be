const roleModel = require('../models/roleModel');

exports.listRoles = async () => roleModel.getAll();

exports.getRole = async (id) => roleModel.getById(id);

exports.createRole = async ({ name, description }) => {
  return roleModel.create({ name, description });
};

exports.updateRole = async (id, { name, description }) => {
  return roleModel.update(id, { name, description });
};

exports.deleteRole = async (id) => roleModel.softDelete(id);
