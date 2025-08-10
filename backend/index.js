require("dotenv").config();

// import express dan middleware lain
const express = require("express");
const path = require("path");
const cors = require("cors");

// import semua router
const cabangRoutes          = require("./src/features/cabang/cabangRoutes");
const adminRoutes           = require("./src/features/administratif/administratifRoutes");
const terapisRoutes         = require("./src/features/terapis/terapisRoutes");
const keahlianRoutes        = require("./src/features/keahlianPaket/keahlianPaketRoutes");
const sesiRoutes            = require("./src/features/sesi/sesiRoutes");
const sifRoutes             = require("./src/features/sif/sifRoutes");
const hargaPaketRoutes      = require("./src/features/hargaPaket/hargaPaketRoutes");
const jamKerjaRoutes        = require("./src/features/jamKerja/jamKerjaRoutes");
const kehadiranRoutes        = require("./src/features/kehadiran/kehadiranRoutes");
const pasienRoutes          = require("./src/features/pasien/pasienRoutes");
const penjadwalanRoutes     = require("./src/features/penjadwalan/penjadwalanRoutes");
const transaksiHarianRoutes = require("./src/features/transaksiHarian/transaksiHarianRoutes");
const signInRoutes          = require("./src/features/signIn/signInRoutes");
const sesiRuanganRoutes          = require("./src/features/sesiRuangan/sesiRuanganRoutes");

// inisialisasi Express
const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// static assets (jika ada)
app.use(
  "/assets/cabang",
  express.static(path.join(__dirname, "src", "assets", "cabang"))
);
app.use(
  "/assets/administratif",
  express.static(path.join(__dirname, "src", "assets", "administratif"))
);
app.use(
  "/assets/terapis",
  express.static(path.join(__dirname, "src", "assets", "terapis"))
);
app.use(
  "/assets/paket",
  express.static(path.join(__dirname, "src", "assets", "paket"))
);
app.use(
  "/assets/transaksi-harian",
  express.static(path.join(__dirname, "src", "assets", "transaksi-harian"))
);

// health-check
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// mount router ke "/api"
app.use("/api", cabangRoutes);
app.use("/api", adminRoutes);
app.use("/api", terapisRoutes);
app.use("/api", keahlianRoutes);
app.use("/api", sesiRoutes);
app.use("/api", sifRoutes);
app.use("/api", hargaPaketRoutes);
app.use("/api", jamKerjaRoutes);
app.use("/api", kehadiranRoutes);
app.use("/api", pasienRoutes);
app.use("/api/penjadwalan", penjadwalanRoutes);
app.use("/api", transaksiHarianRoutes);
app.use("/api", signInRoutes);
app.use("/api", sesiRuanganRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server berjalan di port ${PORT}`);
});

