const express = require("express");
const pengontrol = require("./PasienController");
const { verifyToken } = require("../../middlewares/auth"); // Pastikan path ini benar

const rute = express.Router();

/**
 * @route   GET /api/pasien
 * @desc    Mendapatkan semua data pasien
 * @access  Private (memerlukan token)
 */
rute.get("/pasien", verifyToken, pengontrol.daftar);

/**
 * @route   POST /api/pasien
 * @desc    Membuat data pasien baru
 * @access  Private (memerlukan token)
 */
rute.post("/pasien", verifyToken, pengontrol.tambah);

/**
 * @route   PUT /api/pasien/:id
 * @desc    Memperbarui data pasien berdasarkan ID
 * @access  Private (memerlukan token)
 */
rute.put("/pasien/:id", verifyToken, pengontrol.perbarui);


module.exports = rute;
