// file: backend/src/features/kehadiran/kehadiranController.js

const layanan = require("./kehadiranService");

const pengontrol = {
  daftar: async (req, res) => {
    try {
      const { tanggal } = req.query;
      const data = await layanan.daftarKehadiran(tanggal);
      res.json({ success: true, data: data || [] });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  catat: async (req, res) => {
    try {
      const hasilProses = await layanan.catatKehadiran(req.body);
      
      // Jika ada jadwal alternatif yang dihasilkan (karena ada pembatalan)
      if (hasilProses.jadwalAlternatif && hasilProses.jadwalAlternatif.length > 0) {
        return res.status(200).json({
          success: true,
          message: "Kehadiran dicatat. Beberapa jadwal terdampak dan saran pengganti telah dibuat.",
          data: hasilProses.kehadiran,
          alternatif: hasilProses.jadwalAlternatif, // Kirim data alternatif ke frontend
        });
      }

      // Respon standar jika tidak ada jadwal yang terdampak
      res.json({ 
        success: true, 
        message: "Kehadiran berhasil dicatat.", 
        data: hasilProses.kehadiran 
      });
    } catch (e) {
      // Kirim stack trace hanya saat development untuk debugging
      const errorMessage = process.env.NODE_ENV === 'development' ? e.stack : e.message;
      res.status(400).json({ success: false, message: e.message, error: errorMessage });
    }
  },
};

module.exports = pengontrol;