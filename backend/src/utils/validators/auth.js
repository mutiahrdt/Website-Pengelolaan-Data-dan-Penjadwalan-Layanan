const { body } = require("express-validator");

const validateSignIn = [
  body("username").notEmpty().withMessage("Username perlu diisi!"),
  body("password").isLength({ min: 6 }).withMessage("Password minimal 6 karakter!"),
];

module.exports = { validateSignIn };
