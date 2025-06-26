import * as userService from '../services/userService.js';

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
    await userService.createUser({ username, email, password, rut, role_id, points });
    res.status(201).json({ message: 'User created successfully' });
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
