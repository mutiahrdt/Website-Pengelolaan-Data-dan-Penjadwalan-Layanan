const service = require("./sesiService");

const sesiController = {
  // List all sesi
  daftar: async (req, res) => {
    try {
      const data = await service.daftarSesi();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  // Tambah sesi
  tambah: async (req, res) => {
    try {
      const { id_cabang, nama_sesi, jam_mulai, jam_selesai, status_sesi } = req.body;
      await service.buatSesi({ id_cabang, nama_sesi, jam_mulai, jam_selesai, status_sesi });
      res.status(201).json({ success: true, message: "Sesi ditambahkan" });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  // Edit sesi
  edit: async (req, res) => {
    try {
      const { id_sesi } = req.params;
      const { nama_sesi, jam_mulai, jam_selesai, status_sesi } = req.body;
      await service.perbaruiSesi({ id_sesi, nama_sesi, jam_mulai, jam_selesai, status_sesi });
      res.json({ success: true, message: "Sesi diperbarui" });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },
};

module.exports = sesiController;