const express = require("express");
const router = express.Router();
const signInController = require("./signInController");
const { validateSignIn } = require("../../utils/validators/auth");

router.post("/signin", validateSignIn, signInController.signIn);

module.exports = router;