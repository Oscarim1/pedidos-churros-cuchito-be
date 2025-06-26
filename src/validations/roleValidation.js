const { body } = require('express-validator');

exports.createRoleValidation = [
  body('name').isString().notEmpty(),
  body('description').optional().isString()
];

exports.updateRoleValidation = [
  body('name').optional().isString().notEmpty(),
  body('description').optional().isString()
];
