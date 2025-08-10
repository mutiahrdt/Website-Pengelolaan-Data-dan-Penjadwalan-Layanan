// File: api/transaksi-harian/transaksiHarianRoutes.js (DIPERBAIKI)

const express = require("express");
const pengontrol = require("./transaksiHarianController");
// PERBAIKAN: Impor middleware yang benar. Asumsi pasien juga bisa memesan.
const { verifyToken, onlyAdmin } = require("../../middlewares/auth");
const { upload } = require('../../utils/uploadFoto');

// Gunakan nama variabel 'rute' secara konsisten
const rute = express.Router();

// --- Rute untuk pengelolaan data transaksi oleh Admin ---
rute.get("/transaksi-harian", verifyToken, onlyAdmin, pengontrol.daftar);
rute.get("/transaksi-harian/detail/:id_pesanan", verifyToken, onlyAdmin, pengontrol.detail);
rute.get("/transaksi-harian/options", verifyToken, onlyAdmin, pengontrol.getOptions);

// Rute untuk menambah/mengedit data (seperti foto, harga) di form "Edit Informasi"
// Ini menggunakan multipart/form-data untuk menangani upload file.
rute.post(
    "/transaksi-harian", 
    verifyToken, 
    onlyAdmin,
    upload.single('informasi_file'), // Nama field dari FormData di frontend
    pengontrol.tambah
);
rute.post("/pesanan-baru", verifyToken, pengontrol.buatPesanan);

module.exports = rute;