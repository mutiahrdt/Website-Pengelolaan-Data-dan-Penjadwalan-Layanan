const pool = require("../../utils/db");

const administratifModel = {
  // Cek username exist
  async cekUsernameExists(username) {
    const res = await pool.query(
      "SELECT COUNT(*) FROM ADMINISTRATIF WHERE USERNAME = $1",
      [username]
    );
    return parseInt(res.rows[0].count, 10) > 0;
  },

  // Cek username duplikat saat edit
  async cekUsernameDuplikat(username, id_administratif) {
    const res = await pool.query(
      "SELECT COUNT(*) FROM ADMINISTRATIF WHERE USERNAME = $1 AND ID_ADMINISTRATIF != $2",
      [username, id_administratif]
    );
    return parseInt(res.rows[0].count, 10) > 0;
  },

  // Cek cabang ada
  async cekCabangAda(id_cabang) {
    const res = await pool.query(
      "SELECT COUNT(*) FROM CABANG WHERE ID_CABANG = $1",
      [id_cabang]
    );
    return parseInt(res.rows[0].count, 10) > 0;
  },

  // Insert ADMINISTRATIF
  async insertAdministratif({
    id_administratif,
    username,
    hashedPassword,
    nama_admin,
    inisial_admin,
    foto_admin,
    nama_role,
    status_admin,
  }) {
    await pool.query(
      `INSERT INTO ADMINISTRATIF
      (ID_ADMINISTRATIF, USERNAME, PASSWORD, NAMA_ADMIN, INISIAL_ADMIN, FOTO_ADMIN, NAMA_ROLE, STATUS_ADMIN)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        id_administratif,
        username,
        hashedPassword,
        nama_admin,
        inisial_admin,
        foto_admin,
        nama_role,
        status_admin,
      ]
    );
  },

  async getAdministratifById(id_administratif) {
    const res = await pool.query(
      "SELECT * FROM ADMINISTRATIF WHERE ID_ADMINISTRATIF = $1",
      [id_administratif]
    );
    return res.rows[0];
  },

  // Update ADMINISTRATIF
  async updateAdministratif({
    id_administratif,
    username,
    hashedPassword,
    nama_admin,
    inisial_admin,
    foto_admin,
    nama_role,
    status_admin,
  }) {
    await pool.query(
      `UPDATE ADMINISTRATIF SET
        USERNAME = $2,
        PASSWORD = $3,
        NAMA_ADMIN = $4,
        INISIAL_ADMIN = $5,
        FOTO_ADMIN = $6,
        NAMA_ROLE = $7,
        STATUS_ADMIN = $8
      WHERE ID_ADMINISTRATIF = $1`,
      [
        id_administratif,
        username,
        hashedPassword,
        nama_admin,
        inisial_admin,
        foto_admin,
        nama_role,
        status_admin,
      ]
    );
  },

  // Ambil semua admin + semua riwayat alokasi cabang
  async daftarAdministratifWithAlokasi() {
    const res = await pool.query(`
      SELECT 
        a.ID_ADMINISTRATIF,
        a.USERNAME,
        a.NAMA_ADMIN,
        a.INISIAL_ADMIN,
        a.FOTO_ADMIN,
        a.NAMA_ROLE,
        a.STATUS_ADMIN,
        a.PASSWORD,
        al.ID_CABANG,
        al.WAKTU_BERLAKU,
        al.STATUS_ALOKASI,
        c.NAMA_CABANG
      FROM ADMINISTRATIF a
      LEFT JOIN ALOKASI_ADMIN al ON a.ID_ADMINISTRATIF = al.ID_ADMINISTRATIF
      LEFT JOIN CABANG c ON al.ID_CABANG = c.ID_CABANG
      WHERE a.NAMA_ROLE = 'Admin'
      ORDER BY a.ID_ADMINISTRATIF ASC, al.WAKTU_BERLAKU DESC
    `);

    // Group by admin, masukkan alokasi ke array "cabang"
    const map = {};
    for (const row of res.rows) {
      if (!map[row.id_administratif]) {
        map[row.id_administratif] = {
          id_administratif: row.id_administratif,
          username: row.username,
          nama_admin: row.nama_admin,
          inisial_admin: row.inisial_admin,
          foto_admin: row.foto_admin,
          nama_role: row.nama_role,
          status_admin: row.status_admin,
          password: row.password,
          cabang: [],
        };
      }
      if (row.id_cabang) {
        map[row.id_administratif].cabang.push({
          id_cabang: row.id_cabang,
          nama_cabang: row.nama_cabang,
          waktu_berlaku: row.waktu_berlaku,
          status_alokasi: row.status_alokasi,
        });
      }
    }
    return Object.values(map);
  },

  // Insert alokasi admin (perubahan cabang)
  async insertAlokasiAdmin({
    id_administratif,
    id_cabang,
    waktu_berlaku,
    status_alokasi = true,
  }) {
    await pool.query(
      `INSERT INTO ALOKASI_ADMIN
      (ID_ADMINISTRATIF, ID_CABANG, WAKTU_BERLAKU, STATUS_ALOKASI)
      VALUES ($1, $2, $3, $4)`,
      [id_administratif, id_cabang, waktu_berlaku, status_alokasi]
    );
  },

  // Ambil semua alokasi aktif admin ini
  async getAllAlokasiAktif(id_administratif) {
    const res = await pool.query(
      `SELECT * FROM ALOKASI_ADMIN
       WHERE ID_ADMINISTRATIF = $1 AND STATUS_ALOKASI = true
       ORDER BY WAKTU_BERLAKU DESC`,
      [id_administratif]
    );
    return res.rows;
  },

  // Nonaktifkan semua alokasi aktif admin ini di cabang tertentu (perubahan cabang)
  async nonaktifkanAlokasiLama(id_administratif, id_cabang) {
    await pool.query(
      `UPDATE ALOKASI_ADMIN SET STATUS_ALOKASI = false
       WHERE ID_ADMINISTRATIF = $1 AND ID_CABANG = $2 AND STATUS_ALOKASI = true`,
      [id_administratif, id_cabang]
    );
  },

  async cekCabangAktif(id_cabang) {
    const res = await pool.query(
      "SELECT COUNT(*) FROM CABANG WHERE ID_CABANG = $1 AND STATUS_CABANG = true",
      [id_cabang]
    );
    return parseInt(res.rows[0].count, 10) > 0;
  },
};

module.exports = administratifModel;