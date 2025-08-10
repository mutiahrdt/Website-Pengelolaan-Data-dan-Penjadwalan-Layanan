const administratifService = require("./administratifService");

const administratifController = {
  async daftar(req, res) {
    try {
      const data = await administratifService.daftarAdministratif();
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  async buat(req, res) {
  try {
    const { nama_admin, username, id_cabang, status_admin, wkt_berlaku } = req.body;
    const password = req.body.password;
    const foto_file = req.file || req.body.foto_admin;

    let statusBool;
    if (
      status_admin === "true" ||
      status_admin === true ||
      status_admin === 1 ||
      status_admin === "Aktif"
    ) {
      statusBool = true;
    } else {
      statusBool = false;
    }

    await administratifService.buatAdministratif({
      username,
      password,
      nama_admin,
      id_cabang,
      status_admin: statusBool, // PAKAI BOOL
      wkt_berlaku: wkt_berlaku || new Date(),
      foto_file,
    });
    res.json({ success: true, message: "Admin berhasil ditambah" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
},

  async update(req, res) {
  try {
    const id = req.params.id;
    const { nama_admin, username, id_cabang, status_admin, wkt_berlaku } = req.body;
    const password = req.body.password;
    const foto_file = req.file || req.body.foto_admin;
    const waktuBerlaku = wkt_berlaku || new Date().toISOString();

    // Fix di sini, parsing agar status_admin pasti boolean
    let statusBool;
    if (
      status_admin === "true" ||
      status_admin === true ||
      status_admin === 1 ||
      status_admin === "Aktif"
    ) {
      statusBool = true;
    } else {
      statusBool = false;
    }

    await administratifService.perbaruiAdministratif(id, {
      username,
      password,
      nama_admin,
      id_cabang,
      status_admin: statusBool,
      wkt_berlaku: waktuBerlaku,
      foto_file,
    });
    res.json({ success: true, message: "Admin berhasil diupdate" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
},
};

module.exports = administratifController;