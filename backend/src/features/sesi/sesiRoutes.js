const express = require("express");
const sesiController = require("./sesiController");
const { verifyToken, onlySuperadmin } = require("../../middlewares/auth");

const router = express.Router();

router.get("/sesi", verifyToken, sesiController.daftar);
router.post("/sesi", verifyToken, onlySuperadmin, sesiController.tambah);
router.put("/sesi/:id_sesi", verifyToken, onlySuperadmin, sesiController.edit);

module.exports = router;