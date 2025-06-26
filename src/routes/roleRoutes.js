const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { createRoleValidation, updateRoleValidation } = require('../validations/roleValidation');
const authenticateToken = require('../middlewares/auth');
const authorizeRoles = require('../middlewares/roles');

router.get('/', authenticateToken, authorizeRoles('admin'), roleController.listRoles);
router.get('/:id', authenticateToken, authorizeRoles('admin'), roleController.getRole);
router.post('/', authenticateToken, authorizeRoles('admin'), createRoleValidation, roleController.createRole);
router.put('/:id', authenticateToken, authorizeRoles('admin'), updateRoleValidation, roleController.updateRole);
router.delete('/:id', authenticateToken, authorizeRoles('admin'), roleController.deleteRole);

module.exports = router;
