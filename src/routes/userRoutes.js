const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { createUserValidation, updateUserValidation } = require('../validations/userValidation');
const authenticateToken = require('../middlewares/auth');
const authorizeRoles = require('../middlewares/roles');

// Todas requieren estar autenticado, solo admin puede eliminar o listar todos los usuarios
router.get('/', authenticateToken, authorizeRoles('admin'), userController.listUsers);
router.get('/:id', authenticateToken, userController.getUser);
router.post('/', authenticateToken, authorizeRoles('admin'), createUserValidation, userController.createUser);
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateUserValidation, userController.updateUser);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), userController.deleteUser);

module.exports = router;
