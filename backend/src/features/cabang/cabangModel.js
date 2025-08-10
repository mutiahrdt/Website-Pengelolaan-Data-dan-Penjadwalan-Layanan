const pool = require("../../utils/db");

const cabangModel = {
  // daftarCabang
  async daftarCabang() {
    const res = await pool.query(
      `SELECT id_cabang, nama_cabang, alamat_cabang, foto_cabang, status_cabang
       FROM cabang
       ORDER BY id_cabang ASC`
    );
    return res.rows;
  },

  //daftarCabang aktif
  async daftarCabangAktif() {
    const res = await pool.query(
      `SELECT id_cabang, nama_cabang
       FROM cabang
       WHERE status_cabang = true
       ORDER BY nama_cabang ASC`
    );
    return res.rows;
  },

  async cekCabangAktif(id_cabang) {
    const res = await pool.query(
      "SELECT COUNT(*) FROM cabang WHERE id_cabang = $1 AND status_cabang = true",
      [id_cabang]
    );
    return parseInt(res.rows[0].count, 10) > 0;
  },

  // cariCabang
  async cariCabang(id_cabang) {
    const res = await pool.query(
      `SELECT id_cabang, nama_cabang, alamat_cabang, foto_cabang, status_cabang
       FROM cabang WHERE id_cabang = $1`, [id_cabang]
    );
    return res.rows[0];
  },

  // buatCabang
  async buatCabang({ id_cabang, nama_cabang, alamat_cabang, foto_cabang, status_cabang }) {
    await pool.query(
      `INSERT INTO cabang (id_cabang, nama_cabang, alamat_cabang, foto_cabang, status_cabang)
       VALUES ($1, $2, $3, $4, $5)`,
      [id_cabang, nama_cabang, alamat_cabang, foto_cabang, status_cabang]
    );
    return { id_cabang, nama_cabang, alamat_cabang, foto_cabang, status_cabang };
  },

  // perbaruiCabang
  async perbaruiCabang({ id_cabang, nama_cabang, alamat_cabang, foto_cabang, status_cabang }) {
    await pool.query(
      `UPDATE cabang SET
        nama_cabang = $2,
        alamat_cabang = $3,
        foto_cabang = $4,
        status_cabang = $5
      WHERE id_cabang = $1`,
      [id_cabang, nama_cabang, alamat_cabang, foto_cabang, status_cabang]
    );
    return { id_cabang, nama_cabang, alamat_cabang, foto_cabang, status_cabang };
  },

  async nonaktifkanRuanganByCabang(id_cabang) {
    await pool.query(
      `UPDATE ruangan SET status_ruangan = false WHERE id_cabang = $1`,
      [id_cabang]
    );
  },

  // daftarRuangan
  async daftarRuangan(id_cabang) {
    const res = await pool.query(
      `SELECT id_ruangan, id_cabang, nama_ruangan, status_ruangan
       FROM ruangan WHERE id_cabang = $1
       ORDER BY id_ruangan ASC`, [id_cabang]
    );
    return res.rows;
  },

  // buatRuangan
  async buatRuangan({ id_ruangan, id_cabang, nama_ruangan, status_ruangan }) {
    await pool.query(
      `INSERT INTO ruangan (id_ruangan, id_cabang, nama_ruangan, status_ruangan)
       VALUES ($1, $2, $3, $4)`,
      [id_ruangan, id_cabang, nama_ruangan, status_ruangan]
    );
    return { id_ruangan, id_cabang, nama_ruangan, status_ruangan };
  },

  // perbaruiRuangan
  async perbaruiRuangan({ id_ruangan, id_cabang, nama_ruangan, status_ruangan }) {
    await pool.query(
      `UPDATE ruangan SET
        id_cabang = $2,
        nama_ruangan = $3,
        status_ruangan = $4
      WHERE id_ruangan = $1`,
      [id_ruangan, id_cabang, nama_ruangan, status_ruangan]
    );
    return { id_ruangan, id_cabang, nama_ruangan, status_ruangan };
  },
};

module.exports = cabangModel;