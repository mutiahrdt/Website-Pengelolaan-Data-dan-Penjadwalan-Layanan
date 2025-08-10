// File: backend/transaksiHarianController.js (REVISI LENGKAP)

const layanan = require('./transaksiHarianService');
// simpanFoto tidak lagi dipanggil langsung di sini, bisa dihapus jika tidak digunakan di tempat lain
// const { simpanFoto } = require('../../utils/uploadFoto');

const pengontrol = {
  // Handler untuk mendapatkan daftar transaksi selesai
  daftar: async (req, res) => {
    try {
      const data = await layanan.daftar();
      res.json({ data });
    } catch (e) {
      res.status(500).json({ message: "Gagal mengambil daftar transaksi: " + e.message });
    }
  },

  // Handler untuk mendapatkan detail satu transaksi
  detail: async (req, res) => {
    try {
      const { id_pesanan } = req.params;
      const data = await layanan.detail(id_pesanan);
      res.json({ data });
    } catch (e) {
      res.status(404).json({ message: e.message });
    }
  },

  // Handler untuk MENAMBAH/MENGEDIT data pada form transaksi (seperti foto, harga, dll)
  tambah: async (req, res) => {
    try {
      // Meneruskan semua dari body (termasuk nama_file_lama) dan foto dari req.file
      const dataBaru = await layanan.tambah({ ...req.body, foto: req.file });
      res.status(201).json({ message: "Informasi berhasil disimpan.", data: dataBaru });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  },

  // Handler untuk mengambil data options dropdown
  getOptions: async (req, res) => {
    try {
        const data = await layanan.getOptions();
        res.json({ data });
    } catch(e) {
        res.status(500).json({ message: "Gagal mengambil data options: " + e.message });
    }
  },

  // --- HANDLER BARU UNTUK MEMBUAT PESANAN DENGAN LOGIKA DENDA ---
  /**
   * Handler ini seharusnya dipanggil dari rute yang bertanggung jawab untuk membuat pesanan baru.
   * Contoh: POST /pesanan-baru
   */
  buatPesanan: async (req, res) => {
    try {
      // Data dari frontend (misalnya id_pasien, id_jadwal, dll.) ada di req.body
      const hasilPesanan = await layanan.buatPesananDenganDenda(req.body);

      // Anda mungkin perlu melanjutkan dengan menyimpan `hasilPesanan` ini ke database
      // melalui model yang sesuai. Untuk saat ini, kita kembalikan hasilnya.

      res.status(201).json({ 
        message: "Proses pembuatan pesanan berhasil (dengan pengecekan denda).", 
        data: hasilPesanan 
      });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  },
};

module.exports = pengontrol;