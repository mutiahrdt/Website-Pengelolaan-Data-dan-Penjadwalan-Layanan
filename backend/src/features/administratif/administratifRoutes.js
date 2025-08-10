const express = require("express");
const administratifController = require("./administratifController");
const { upload } = require("../../utils/uploadFoto");

const router = express.Router();

router.get("/admin", administratifController.daftar);
router.post("/admin", upload.single("foto_admin"), administratifController.buat);
router.put("/admin/:id", upload.single("foto_admin"), administratifController.update);

module.exports = router;