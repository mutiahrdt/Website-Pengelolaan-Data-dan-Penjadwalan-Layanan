const pool = require("../../utils/db");

// Mengambil detail satu Sif berdasarkan ID
async function getById(id_sif) {
  const query = `
    SELECT * FROM sif WHERE id_sif = $1
  `;
  const { rows } = await pool.query(query, [id_sif]);
  return rows[0];
}

async function daftarSif() {
  const query = `
    SELECT ID_SIF, NAMA_SIF, JAM_MULAI, JAM_SELESAI, STATUS_SIF 
    FROM sif 
    ORDER BY JAM_MULAI ASC
  `;
  const { rows } = await pool.query(query);
  return rows;
}

async function buatSif({ id_sif, nama_sif, jam_mulai, jam_selesai, status_sif }) {
  const query = `
    INSERT INTO SIF (ID_SIF, NAMA_SIF, JAM_MULAI, JAM_SELESAI, STATUS_SIF)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [id_sif, nama_sif, jam_mulai, jam_selesai, status_sif]);
  return rows[0];
}

async function perbaruiSif({ id_sif, nama_sif, jam_mulai, jam_selesai, status_sif }) {
  const query = `
    UPDATE sif SET 
      nama_sif = $2, 
      jam_mulai = $3, 
      jam_selesai = $4, 
      status_sif = $5 
    WHERE id_sif = $1
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [id_sif, nama_sif, jam_mulai, jam_selesai, status_sif]);
  return rows[0];
}

module.exports = {
  getById, 
  daftarSif,
  buatSif,
  perbaruiSif,
};