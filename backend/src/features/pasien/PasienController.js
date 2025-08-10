const layanan = require('./pasienService');

const pengontrol = {
  /**
   * Controller untuk memanggil service daftarPasien.
   */
  daftar: async (req, res) => {
    try {
      const data = await layanan.daftarPasien();
      res.json({ data });
    } catch (e) {
      res.status(500).json({ message: "Terjadi kesalahan pada server: " + e.message });
    }
  },

  /**
   * Controller untuk memanggil service buatPasien.
   */
  tambah: async (req, res) => {
    try {
      const dataBaru = await layanan.buatPasien(req.body);
      // Sesuai pseudocode, menampilkan pesan sukses
      res.status(201).json({ message: "Data pasien berhasil ditambahkan.", data: dataBaru });
    } catch (e) {
      // Menampilkan pesan error dari validasi service
      res.status(400).json({ message: e.message });
    }
  },

  /**
   * Controller untuk memanggil service perbaruiPasien.
   */
  perbarui: async (req, res) => {
    try {
      const { id } = req.params;
      const dataDiperbarui = await layanan.perbaruiPasien(id, req.body);
      // Sesuai pseudocode, menampilkan pesan sukses
      res.json({ message: "Data pasien berhasil diperbarui.", data: dataDiperbarui });
    } catch (e) {
      // Menampilkan pesan error dari validasi service, bisa 400 (bad request) atau 404 (not found)
      if (e.message.includes("tidak ditemukan")) {
         return res.status(404).json({ message: e.message });
      }
      res.status(400).json({ message: e.message });
    }
  },
};

module.exports = pengontrol;