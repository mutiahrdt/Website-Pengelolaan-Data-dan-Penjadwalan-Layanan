const express = require("express");
const sifController = require("./sifController");
const { verifyToken, onlySuperadmin } = require("../../middlewares/auth");

const router = express.Router();

router.get("/sif", verifyToken, sifController.daftarSif);
router.post("/sif", verifyToken, onlySuperadmin, sifController.buatSif);
router.put("/sif/:id_sif", verifyToken, onlySuperadmin, sifController.perbaruiSif);

module.exports = router;