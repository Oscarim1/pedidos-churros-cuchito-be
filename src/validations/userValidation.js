const { body } = require('express-validator');

exports.createUserValidation = [
  body('username').isString().isLength({ min: 3 }),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('role_id').notEmpty(),
  body('rut').optional().isString().isLength({ min: 3 }),
  body('points').optional().isInt()
];

exports.updateUserValidation = [
  body('username').optional().isString().isLength({ min: 3 }),
  body('email').optional().isEmail(),
  body('role_id').optional().notEmpty(),
  body('rut').optional().isString().isLength({ min: 3 }),
  body('points').optional().isInt()
];
