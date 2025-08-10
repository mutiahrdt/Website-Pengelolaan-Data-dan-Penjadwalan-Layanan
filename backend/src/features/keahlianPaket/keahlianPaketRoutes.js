const express = require("express");
const { upload } = require("../../utils/uploadFoto");
const keahlianPaketController = require("./keahlianPaketController");
const { verifyToken, onlySuperadmin } = require("../../middlewares/auth");

const router = express.Router();

// --- KEAHLIAN ENDPOINTS ---

// GET /api/keahlian-paket : Mengambil SEMUA keahlian beserta paket-paketnya (untuk halaman manajemen)
router.get("/keahlian-paket", verifyToken, keahlianPaketController.daftarKeahlianPaket);

// GET /api/keahlian/aktif : Mengambil HANYA keahlian yang aktif (untuk dropdown di form)
router.get("/keahlian/aktif", verifyToken, keahlianPaketController.daftarKeahlianAktif);

// POST /api/keahlian : Membuat keahlian baru
router.post("/keahlian", verifyToken, onlySuperadmin, keahlianPaketController.tambahKeahlian);

// PUT /api/keahlian/:id_keahlian : Memperbarui keahlian
router.put("/keahlian/:id_keahlian", verifyToken, onlySuperadmin, keahlianPaketController.editKeahlian);


// --- PAKET ENDPOINTS ---

// GET /api/paket : Mengambil SEMUA paket (untuk halaman manajemen paket jika ada)
router.get("/paket", verifyToken, keahlianPaketController.daftarPaket);

// GET /api/paket/aktif : Mengambil HANYA paket yang aktif
router.get("/paket/aktif", verifyToken, keahlianPaketController.daftarPaketAktif);

// POST /api/paket : Membuat paket baru
router.post("/paket", verifyToken, onlySuperadmin, upload.single("gambar_paket"), keahlianPaketController.tambahPaket);

// PUT /api/paket/:id_paket : Memperbarui paket
router.put("/paket/:id_paket", verifyToken, onlySuperadmin, upload.single("gambar_paket"), keahlianPaketController.editPaket);

// GET /api/paket/:id_paket : Mengambil detail satu paket
router.get("/paket/:id_paket", verifyToken, keahlianPaketController.getPaketById);

module.exports = router;