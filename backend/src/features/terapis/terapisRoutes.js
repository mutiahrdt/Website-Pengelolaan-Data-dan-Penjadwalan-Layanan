const express = require("express");
const { upload } = require("../../utils/uploadFoto");
const { verifyToken, onlySuperadmin } = require("../../middlewares/auth");
const terapisController = require("./terapisController");

const router = express.Router(); // Pastikan variabelnya 'router' bukan 'terapisRouter'

// GET /api/terapis : Mengambil SEMUA terapis (untuk halaman manajemen)
router.get("/terapis", verifyToken, terapisController.daftarTerapis);

// GET /api/terapis/aktif : Mengambil HANYA terapis yang aktif (untuk fitur booking/jadwal)
router.get('/terapis/aktif', verifyToken, terapisController.daftarTerapisAktif);

// POST /api/terapis : Membuat terapis baru
router.post(
  "/terapis",
  verifyToken,
  onlySuperadmin,
  upload.single("foto_terapis"),
  terapisController.buatTerapis
);

// PUT /api/terapis/:id_terapis : Memperbarui terapis
router.put(
  "/terapis/:id_terapis",
  verifyToken,
  onlySuperadmin,
  upload.single("foto_terapis"),
  terapisController.perbaruiTerapis
);

module.exports = router;