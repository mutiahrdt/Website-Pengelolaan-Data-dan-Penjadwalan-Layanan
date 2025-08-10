const terapisService = require("./terapisService");

const terapisController = {
  // --- CONTROLLER BARU: untuk endpoint /terapis/aktif ---
  daftarTerapisAktif: async (req, res) => {
    try {
      const data = await terapisService.daftarTerapisAktif();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  daftarTerapis: async (req, res) => {
    try {
      const data = await terapisService.daftarTerapis();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  buatTerapis: async (req, res) => {
    try {
      // Parsing boolean untuk status
      const status_terapis = req.body.status_terapis === 'true' || req.body.status_terapis === true;
      const { nama_terapis, no_hp_terapis, gender_terapis, id_cabang, wkt_berlaku, keahlian_ids } = req.body;
      const foto = req.file;
      const keahlianIdsArray = !keahlian_ids ? [] : (Array.isArray(keahlian_ids) ? keahlian_ids : [keahlian_ids]);

      await terapisService.buatTerapis({
        nama_terapis, no_hp_terapis, gender_terapis, foto, id_cabang, wkt_berlaku,
        status_terapis, // Kirim boolean
        keahlian_ids: keahlianIdsArray
      });
      res.status(201).json({ success: true, message: "Terapis ditambahkan" });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  perbaruiTerapis: async (req, res) => {
    try {
      const { id_terapis } = req.params;
      const status_terapis = req.body.status_terapis === 'true' || req.body.status_terapis === true;
      const { nama_terapis, no_hp_terapis, gender_terapis, id_cabang, wkt_berlaku, keahlian_ids } = req.body;
      const foto = req.file;
      const keahlianIdsArray = !keahlian_ids ? [] : (Array.isArray(keahlian_ids) ? keahlian_ids : [keahlian_ids]);

      await terapisService.perbaruiTerapis({
        id_terapis, nama_terapis, no_hp_terapis, gender_terapis, foto, id_cabang, wkt_berlaku,
        status_terapis, // Kirim boolean
        keahlian_ids: keahlianIdsArray
      });
      res.json({ success: true, message: "Terapis diperbarui" });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  }
};

module.exports = terapisController;