const cabangService = require("./cabangService");

const cabangController = {
  daftarCabang: async (req, res) => {
    try {
      const data = await cabangService.daftarCabang();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  daftarCabangAktif: async (req, res) => {
    try {
      const data = await cabangService.daftarCabangAktif();
      res.json({ success: true, data });
    } catch (e) {
      res.status(500).json({ success: false, message: e.message });
    }
  },

  buatCabang: async (req, res) => {
    try {
      const { nama_cabang, alamat_cabang, status_cabang } = req.body;
      const foto = req.file;
      const data = await cabangService.buatCabang({
        nama_cabang,
        alamat_cabang,
        foto,
        status_cabang,
      });
      res.status(201).json({ success: true, data });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  editCabang: async (req, res) => {
  try {
    const { id_cabang, nama_cabang, alamat_cabang, status_cabang } = req.body;
    const foto = req.file || req.body.foto_cabang; // Ambil dari file upload atau string nama file lama
    const data = await cabangService.perbaruiCabang({
      id_cabang,
      nama_cabang,
      alamat_cabang,
      foto,
      status_cabang,
    });
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
},

  tambahRuangan: async (req, res) => {
    try {
      const { id_cabang, nama_ruangan, status_ruangan } = req.body;
      const data = await cabangService.buatRuangan({
        id_cabang,
        nama_ruangan,
        status_ruangan,
      });
      res.status(201).json({ success: true, data });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  editRuangan: async (req, res) => {
    try {
      const { id_ruangan, id_cabang, nama_ruangan, status_ruangan } = req.body;
      const data = await cabangService.perbaruiRuangan({
        id_ruangan,
        id_cabang,
        nama_ruangan,
        status_ruangan,
      });
      res.json({ success: true, data });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },

  daftarRuangan: async (req, res) => {
    try {
      const { id_cabang } = req.params;
      const data = await cabangService.daftarRuangan(id_cabang);
      res.json({ success: true, data });
    } catch (e) {
      res.status(400).json({ success: false, message: e.message });
    }
  },
};

module.exports = cabangController;