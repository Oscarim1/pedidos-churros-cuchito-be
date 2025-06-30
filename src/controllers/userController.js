import * as userService from '../services/userService.js';
import * as roleService from '../services/roleService.js';

export const getUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await userService.getUserById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createUser = async (req, res) => {
  const { username, email, password, rut, role_id, points } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ message: 'username, email and password are required' });
  try {
    const existingRut = await userService.getUserByRut(rut);
    if (existingRut) {
      return res.status(409).json({ message: 'El rut del usuario ya está en uso.' });
    }

    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'El email del usuario ya está en uso.' });
    }

    const existingRole = await roleService.getRoleById(role_id);
    if (!existingRole) {
      return res.status(409).json({ message: 'Rol invalido.' });
    }

    await userService.createUser({ username, email, password, rut, role_id, points });
    res.status(201).json({ message: 'Usuario creado con exito.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, rut, role_id, points, is_active } = req.body;
  try {
    const updated = await userService.updateUser(id, {
      username,
      email,
      password,
      rut,
      role_id,
      points,
      is_active
    });
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await userService.deleteUser(id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
