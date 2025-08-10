const pool = require("../../utils/db");

const signInModel = {
  async cariUsername(username) {
    const query = `
      SELECT
        a.id_administratif,
        a.username,
        a.password,
        a.nama_admin,
        a.inisial_admin,
        a.foto_admin,
        a.nama_role,
        a.status_admin,
        -- Subquery untuk cabang terbaru (riwayat alokasi)
        (
          SELECT id_cabang
          FROM alokasi_admin
          WHERE id_administratif = a.id_administratif
          ORDER BY waktu_berlaku DESC
          LIMIT 1
        ) as id_cabang
      FROM administratif a
      WHERE username = $1
      LIMIT 1
    `;
    const result = await pool.query(query, [username]);
    // .rows[0] atau null kalau tidak ketemu
    return result.rows[0];
  },
};

module.exports = signInModel;
