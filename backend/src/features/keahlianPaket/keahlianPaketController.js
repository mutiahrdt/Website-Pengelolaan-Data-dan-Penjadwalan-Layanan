const service = require("./keahlianPaketService");

const keahlianPaketController = {
  daftarKeahlianPaket: async (req, res) => {
    try {
      const data = await service.daftarKeahlianPaket();
      res.json({ success: true, data }); // Tambahkan success: true untuk konsistensi
    } catch (e) {
      res.status(500).json({ success: false, message: e.message }); // Tambahkan success: false
    }
  },

  tambahKeahlian: async (req, res) => {
    try {
      await service.buatKeahlian(req.body);
      res.status(201).json({ success: true, message: "Keahlian berhasil ditambahkan" });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },
  editKeahlian: async (req, res) => {
    try {
      const { id_keahlian } = req.params;
      await service.perbaruiKeahlian({ id_keahlian, ...req.body });
      res.json({ message: "Keahlian berhasil diperbarui" });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  },
  tambahPaket: async (req, res) => {
    try {
      await service.buatPaket({ ...req.body, file: req.file });
      res.status(201).json({ message: "Paket berhasil ditambahkan" });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  },
  editPaket: async (req, res) => {
    try {
      const { id_paket } = req.params;
      await service.perbaruiPaket({ id_paket, ...req.body, file: req.file });
      res.json({ message: "Paket berhasil diperbarui" });
    } catch (e) {
      res.status(400).json({ message: e.message });
    }
  },
  daftarPaket: async (req, res) => {
    try {
      const data = await service.daftarPaket();
      res.json({ data });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  },
  getPaketById: async (req, res) => {
    try {
      const data = await service.getPaketById(req.params.id_paket);
      if (!data) {
        return res.status(404).json({ message: "Paket tidak ditemukan" });
      }
      res.json({ data });
    } catch (e) {
      res.status(500).json({ message: e.message });
    }
  },
  daftarKeahlianAktif: async (req, res) => {
    try {
      const data = await service.daftarKeahlianAktif();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },
  daftarPaketAktif: async (req, res) => {
    try {
      const data = await service.daftarPaketAktif();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },
};

module.exports = keahlianPaketController;