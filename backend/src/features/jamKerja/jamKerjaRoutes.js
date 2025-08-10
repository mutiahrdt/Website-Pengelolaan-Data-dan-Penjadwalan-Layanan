// file: backend/jamKerja/jamKerjaRoutes.js (FINAL)

const express = require("express");
const pengontrol = require("./jamKerjaController");
const { verifyToken } = require("../../middlewares/auth");

const rute = express.Router();

// POST /api/jam-kerja - Membuat jadwal kerja baru
rute.post("/jam-kerja", verifyToken, pengontrol.buat);

// GET /api/jam-kerja - Mengambil semua jadwal kerja
rute.get("/jam-kerja", verifyToken, pengontrol.dapatkanSemua);

// PUT /api/jam-kerja - Memperbarui jadwal kerja yang ada
// Endpoint disederhanakan. Semua data (keys & values) dikirim di body.
rute.put("/jam-kerja", verifyToken, pengontrol.perbarui);

module.exports = rute;