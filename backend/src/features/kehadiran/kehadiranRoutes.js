// /routes/kehadiranRoutes.js

const express = require("express");
const pengontrol = require("./kehadiranController");
const { verifyToken } = require("../../middlewares/auth");

const rute = express.Router();

// GET /api/kehadiran?tanggal=YYYY-MM-DD
// Mendapatkan semua jadwal terapis beserta status kehadiran pada tanggal tersebut.
rute.get("/kehadiran", verifyToken, pengontrol.daftar);

// PUT /api/kehadiran/catat
// Untuk mencatat kehadiran (check-in) atau mengubah status (misal: izin, sakit).
// Seluruh data yang diperlukan dikirim di req.body.
rute.put("/kehadiran/catat", verifyToken, pengontrol.catat);

module.exports = rute;