// file: backend/jamKerja/jamKerjaController.js (FINAL)

const layananJamKerja = require("./jamKerjaService");

const pengontrolJamKerja = {
  buat: async (req, res) => {
    try {
      const dataBaru = await layananJamKerja.buat(req.body);
      res.status(201).json({ message: "Jam kerja berhasil ditambahkan.", data: dataBaru });
    } catch (e) {
      // Menangkap error jika jadwal sudah ada (Primary Key conflict)
      if (e.code === '23505') { // Kode error PostgreSQL untuk unique violation
        return res.status(409).json({ message: "Jadwal kerja untuk terapis, sif, hari, dan periode tersebut sudah ada." });
      }
      res.status(500).json({ message: e.message });
    }
  },

  perbarui: async (req, res) => {
    try {
        // Payload sekarang diharapkan berupa { keys: {...}, values: {...} }
      const dataDiperbarui = await layananJamKerja.perbarui(req.body);
      if (!dataDiperbarui) {
        return res.status(404).json({ message: "Data jam kerja tidak ditemukan." });
      }
      res.json({ message: "Jam kerja berhasil diperbarui.", data: dataDiperbarui });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  },

  dapatkanSemua: async (req, res) => {
    try {
      const data = await layananJamKerja.dapatkanSemua();
      res.json({ data });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  },
};

module.exports = pengontrolJamKerja;