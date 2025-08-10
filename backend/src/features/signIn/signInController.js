const { validationResult } = require("express-validator");
const signInService = require("./signInService");

const signInController = {
  async signIn(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({
        success: false,
        message: "Validasi gagal",
        errors: errors.array(),
      });
    }

    try {
      const result = await signInService.autentikasiPengguna(
        req.body.username,
        req.body.password
      );
      res.status(200).json({ success: true, message: "Login berhasil", data: result });
    } catch (error) {
      res.status(error.status || 500).json({
        success: false,
        message: error.message || "Terjadi kesalahan server",
      });
    }
  },
};

module.exports = signInController;