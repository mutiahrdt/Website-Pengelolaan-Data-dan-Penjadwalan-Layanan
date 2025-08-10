const express = require("express");
const { upload } = require("../../utils/uploadFoto");
const { verifyToken, onlySuperadmin } = require("../../middlewares/auth");
const cabangController = require("./cabangController");

const cabangRouter = express.Router();

// Cabang endpoints
cabangRouter.get("/cabang", cabangController.daftarCabang);
cabangRouter.post(
  "/cabang",
  verifyToken,
  onlySuperadmin,
  upload.single("foto_cabang"),
  cabangController.buatCabang
);
cabangRouter.put(
  "/cabang",
  verifyToken,
  onlySuperadmin,
  upload.single("foto_cabang"),
  cabangController.editCabang
);

// Ruangan endpoints
cabangRouter.get("/ruangan/:id_cabang",verifyToken, cabangController.daftarRuangan);
cabangRouter.post(
  "/ruangan",
  verifyToken,
  onlySuperadmin,
  cabangController.tambahRuangan
);
cabangRouter.put(
  "/ruangan",
  verifyToken,
  onlySuperadmin,
  cabangController.editRuangan
);

cabangRouter.get("/cabang/aktif", verifyToken, cabangController.daftarCabangAktif);

module.exports = cabangRouter;