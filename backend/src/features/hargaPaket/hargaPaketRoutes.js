// file: backend/hargaPaket/hargaPaketRoutes.js (LENGKAP)

const express = require("express");
const pengontrolHargaPaket = require("./hargaPaketController");
const { verifyToken } = require("../../middlewares/auth");

const rute = express.Router();

// Endpoint ini sekarang pintar. Otomatis filter by cabang jika diakses oleh Admin.
rute.get("/harga-paket", verifyToken, pengontrolHargaPaket.daftar);

rute.post("/harga-paket", verifyToken, pengontrolHargaPaket.tambah);
rute.get("/harga-paket/histori/:id_cabang/:id_paket", verifyToken, pengontrolHargaPaket.histori);

module.exports = rute;