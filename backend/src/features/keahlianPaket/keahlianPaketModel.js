// file: backend/keahlian/keahlianPaketModel.js

const pool = require("../../utils/db");

// Mengambil daftar keahlian beserta paket-paketnya menggunakan CTE (lebih robust)
async function daftarKeahlianPaket() {
  const query = `
    WITH paket_json AS (
      SELECT
        p.id_keahlian,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id_paket', p.id_paket,
            'nama_paket', p.nama_paket,
            'deskripsi_paket', p.deskripsi_paket,
            'kata_kunci', p.kata_kunci,
            'gambar_paket', p.gambar_paket,
            'durasi_paket', p.durasi_paket,
            'status_paket', p.status_paket
          ) ORDER BY p.id_paket
        ) AS paket_list
      FROM paket p
      GROUP BY p.id_keahlian
    )
    SELECT
      k.id_keahlian,
      k.nama_keahlian,
      k.status_keahlian,
      COALESCE(pj.paket_list, '[]'::json) AS paket
    FROM keahlian k
    LEFT JOIN paket_json pj ON k.id_keahlian = pj.id_keahlian
    ORDER BY k.id_keahlian;
  `;
  const res = await pool.query(query);
  return res.rows;
}

// --- CRUD untuk tabel KEAHLIAN ---
async function buatKeahlian({ id_keahlian, nama_keahlian, status_keahlian }) {
  await pool.query(
    `INSERT INTO keahlian (id_keahlian, nama_keahlian, status_keahlian) VALUES ($1, $2, $3)`,
    [id_keahlian, nama_keahlian, status_keahlian]
  );
}

async function perbaruiKeahlian({ id_keahlian, nama_keahlian, status_keahlian }) {
  await pool.query(
    `UPDATE keahlian SET nama_keahlian=$2, status_keahlian=$3 WHERE id_keahlian=$1`,
    [id_keahlian, nama_keahlian, status_keahlian]
  );
}

// --- CRUD untuk tabel PAKET ---
async function buatPaket({
  id_paket, id_keahlian, nama_paket, deskripsi_paket, kata_kunci, gambar_paket, durasi_paket, status_paket
}) {
  await pool.query(
    `INSERT INTO paket 
    (id_paket, id_keahlian, nama_paket, deskripsi_paket, kata_kunci, gambar_paket, durasi_paket, status_paket) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id_paket, id_keahlian, nama_paket, deskripsi_paket, kata_kunci, gambar_paket, durasi_paket, status_paket]
  );
}

async function perbaruiPaket({
  id_paket, nama_paket, deskripsi_paket, kata_kunci, gambar_paket, durasi_paket, status_paket
}) {
  await pool.query(
    `UPDATE paket SET 
      nama_paket=$2, deskripsi_paket=$3, kata_kunci=$4, gambar_paket=$5, durasi_paket=$6, status_paket=$7
      WHERE id_paket=$1`,
    [id_paket, nama_paket, deskripsi_paket, kata_kunci, gambar_paket, durasi_paket, status_paket]
  );
}

async function daftarPaket() {
  const res = await pool.query(`
    SELECT p.*, k.nama_keahlian
    FROM paket p
    LEFT JOIN keahlian k ON k.id_keahlian = p.id_keahlian
    ORDER BY p.id_paket
  `);
  return res.rows;
}

async function getPaketById(id_paket) {
  const res = await pool.query("SELECT * FROM paket WHERE id_paket = $1", [id_paket]);
  return res.rows[0];
}

async function daftarKeahlianAktif() {
  const res = await pool.query(
    `SELECT id_keahlian, nama_keahlian FROM keahlian WHERE status_keahlian = true ORDER BY nama_keahlian ASC`
  );
  return res.rows;
}

async function cekKeahlianAktif(id_keahlian) {
  const res = await pool.query(
    `SELECT COUNT(*) FROM keahlian WHERE id_keahlian = $1 AND status_keahlian = true`,
    [id_keahlian]
  );
  return parseInt(res.rows[0].count, 10) > 0;
}

async function nonaktifkanPaketByKeahlian(id_keahlian) {
  await pool.query(
    `UPDATE paket SET status_paket = false WHERE id_keahlian = $1`,
    [id_keahlian]
  );
}

// --- PERBAIKAN: Query untuk daftarPaketAktif harus memeriksa status keahlian juga ---
async function daftarPaketAktif() {
  const res = await pool.query(`
    SELECT p.id_paket, p.nama_paket, p.durasi_paket
    FROM paket p
    JOIN keahlian k ON p.id_keahlian = k.id_keahlian
    WHERE p.status_paket = true AND k.status_keahlian = true
    ORDER BY p.nama_paket ASC
  `);
  return res.rows;
}

module.exports = {
  daftarKeahlianPaket,
  buatKeahlian,
  perbaruiKeahlian,
  buatPaket,
  perbaruiPaket,
  daftarPaket,
  getPaketById,
  daftarKeahlianAktif,
  cekKeahlianAktif,
  daftarPaketAktif,
  nonaktifkanPaketByKeahlian,
};