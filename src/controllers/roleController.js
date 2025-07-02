import * as roleService from '../services/roleService.js';

export const getRoles = async (req, res) => {
  try {
    const roles = await roleService.getAllRoles();
    res.json(roles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getRoleById = async (req, res) => {
  const { id } = req.params;
  try {
    const role = await roleService.getRoleById(id);
    if (!role) return res.status(404).json({ message: 'Role not found' });
    res.json(role);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createRole = async (req, res) => {
  const { name, description, is_active } = req.body;
  if (!name) return res.status(400).json({ message: 'name is required' });
  try {
    const existingRole = await roleService.getRoleByName(name);
    if (existingRole) return res.status(409).json({ message: 'El Rol ya existe.' });
    const role = await roleService.createRole({ name, description, is_active });
    res.status(201).json(role);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateRole = async (req, res) => {
  const { id } = req.params;
  const { description, is_active } = req.body;
  try {
    const updated = await roleService.updateRole(id, { description, is_active });
    if (!updated) return res.status(404).json({ message: 'Ocurrio un error.' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteRole = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await roleService.deleteRole(id);
    if (!deleted) return res.status(404).json({ message: 'Role not found' });
    res.json({ message: 'Role deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
