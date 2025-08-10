// file: backend/hargaPaket/hargaPaketController.js (LENGKAP & DIPERBAIKI)

const layananHargaPaket = require("./hargaPaketService");

const pengontrolHargaPaket = {
  daftar: async (req, res) => {
    try {
      // Ambil id_cabang dari token. Jika tidak ada (Superadmin), nilainya undefined.
      const { id_cabang } = req.user || {};
      
      // Kirim id_cabang (atau undefined) ke service.
      const data = await layananHargaPaket.dapatkanDaftar(id_cabang);
      
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  tambah: async (req, res) => {
    try {
      const dataBaru = await layananHargaPaket.tambah(req.body);
      res.status(201).json({ message: "Harga baru berhasil ditambahkan", data: dataBaru });
    } catch (e) {
      if (e.code === '23505') { 
        return res.status(409).json({ message: 'Waktu berlaku ini sudah ada. Silakan gunakan waktu yang berbeda.' });
      }
      console.error(e);
      res.status(400).json({ message: e.message || 'Gagal menyimpan data harga.' });
    }
  },

  histori: async (req, res) => {
    try {
      const { id_cabang, id_paket } = req.params;
      const data = await layananHargaPaket.dapatkanHistori(id_cabang, id_paket);
      res.json({ success: true, data });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },
};

module.exports = pengontrolHargaPaket;