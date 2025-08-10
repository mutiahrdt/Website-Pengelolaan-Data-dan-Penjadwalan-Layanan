// file: backend/jamKerja/jamKerjaModel.js (LENGKAP & DIPERBAIKI)

const pool = require("../../utils/db");

// Fungsi 'buat' dan 'perbarui' dari kode Anda sudah benar dan tidak perlu diubah.
// Kita hanya fokus pada 'dapatkanSemua'

async function buat({ id_terapis, id_sif, hari_kerja, triwulan, kuota_jam_kerja, status_bekerja }) {
  const query = `
    INSERT INTO JAM_KERJA (ID_TERAPIS, ID_SIF, HARI_KERJA, TRIWULAN, KUOTA_JAM_KERJA, STATUS_BEKERJA)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [id_terapis, id_sif, hari_kerja, triwulan, kuota_jam_kerja, status_bekerja]);
  return rows[0];
}

async function perbarui(keys, values) {
  const { id_terapis, id_sif, hari_kerja, triwulan } = keys;
  const { kuota_jam_kerja, status_bekerja } = values;
  const query = `
    UPDATE JAM_KERJA SET
      KUOTA_JAM_KERJA = $5,
      STATUS_BEKERJA = $6
    WHERE ID_TERAPIS = $1 AND ID_SIF = $2 AND HARI_KERJA = $3 AND TRIWULAN = $4
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [id_terapis, id_sif, hari_kerja, triwulan, kuota_jam_kerja, status_bekerja]);
  return rows[0];
}

async function dapatkanSemua() {
  const query = `
    SELECT
      jk.ID_TERAPIS AS id_terapis, 
      jk.ID_SIF AS id_sif, 
      t.NAMA_TERAPIS AS nama_terapis, 
      t.INISIAL_TERAPIS AS inisial_terapis,
      s.NAMA_SIF AS nama_sif, 
      s.JAM_MULAI AS jam_mulai,       
      s.JAM_SELESAI AS jam_selesai,   
      jk.HARI_KERJA AS hari_kerja, 
      jk.KUOTA_JAM_KERJA AS kuota_jam_kerja, 
      jk.TRIWULAN AS triwulan, 
      jk.STATUS_BEKERJA AS status_bekerja
    FROM JAM_KERJA jk
    JOIN TERAPIS t ON jk.ID_TERAPIS = t.ID_TERAPIS
    JOIN SIF s ON jk.ID_SIF = s.ID_SIF 
    ORDER BY t.NAMA_TERAPIS ASC, jk.TRIWULAN DESC, jk.HARI_KERJA ASC;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

module.exports = {
  buat,
  perbarui,
  dapatkanSemua,
};