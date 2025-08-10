// File: backend/terapis/terapisModel.js

const pool = require("../../utils/db");

// --- FUNGSI-FUNGSI KEAHLIAN (TIDAK BERUBAH) ---
async function getKeahlianTerapis(id_terapis) {
  const res = await pool.query("SELECT id_keahlian FROM keahlian_terapis WHERE id_terapis = $1", [id_terapis]);
  return res.rows.map(r => r.id_keahlian);
}
async function hapusKeahlianTerapis(id_terapis) {
  await pool.query("DELETE FROM keahlian_terapis WHERE id_terapis = $1", [id_terapis]);
}
async function tambahKeahlianTerapis({ id_terapis, id_keahlian }) {
  await pool.query("INSERT INTO keahlian_terapis (id_terapis, id_keahlian, status_keahlian_terapis) VALUES ($1, $2, true)", [id_terapis, id_keahlian]);
}

async function daftarTerapisAktif() {
  const res = await pool.query(
    `SELECT id_terapis, nama_terapis, inisial_terapis, gender_terapis, foto_terapis
     FROM terapis WHERE status_terapis = true ORDER BY nama_terapis ASC`
  );
  return res.rows;
}

async function cekTerapisAktif(id_terapis) {
  const res = await pool.query(
    `SELECT COUNT(*) FROM terapis WHERE id_terapis = $1 AND status_terapis = true`,
    [id_terapis]
  );
  return parseInt(res.rows[0].count, 10) > 0;
}

async function daftarTerapis() {
  // Query ini lebih robust dan mengambil semua data yang diperlukan
  const query = `
    SELECT
        t.*,
        COALESCE(
            (
                SELECT jsonb_agg(jsonb_build_object(
                    'id_cabang', c.id_cabang,
                    'nama_cabang', c.nama_cabang,
                    'waktu_berlaku', ac.waktu_berlaku,
                    'status_alokasi', ac.status_alokasi
                ) ORDER BY ac.waktu_berlaku DESC)
                FROM alokasi_terapis ac -- Pastikan nama tabel ini benar
                JOIN cabang c ON ac.ID_CABANG = c.ID_CABANG
                WHERE ac.ID_TERAPIS = t.ID_TERAPIS
            ), '[]'::jsonb
        ) as cabang,
        COALESCE(
            (
                SELECT jsonb_agg(jsonb_build_object(
                  'id_keahlian', k.id_keahlian,
                  'nama_keahlian', k.nama_keahlian
                ))
                FROM keahlian_terapis kt
                JOIN keahlian k ON kt.id_keahlian = k.id_keahlian
                WHERE kt.id_terapis = t.id_terapis
            ), '[]'::jsonb
        ) as keahlian_full, -- Data lengkap untuk display di tabel
        COALESCE(
            (
                SELECT jsonb_agg(kt.id_keahlian)
                FROM keahlian_terapis kt
                WHERE kt.id_terapis = t.id_terapis
            ), '[]'::jsonb
        ) as keahlian_ids -- Hanya ID untuk pre-fill form
    FROM terapis t
    ORDER BY t.nama_terapis ASC;
  `;
  const { rows } = await pool.query(query);
  return rows;
}

async function cariTerapis(id_terapis) {
  const res = await pool.query(`SELECT * FROM terapis WHERE id_terapis = $1`, [id_terapis]);
  return res.rows[0];
}

async function buatTerapis(data) {
  const { id_terapis, nama_terapis, no_hp_terapis, gender_terapis, foto_terapis, inisial_terapis, status_terapis } = data;
  await pool.query(
    `INSERT INTO terapis (id_terapis, nama_terapis, no_hp_terapis, gender_terapis, foto_terapis, inisial_terapis, status_terapis) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id_terapis, nama_terapis, no_hp_terapis, gender_terapis, foto_terapis, inisial_terapis, status_terapis]
  );
}

async function perbaruiTerapis(data) {
  const { id_terapis, nama_terapis, no_hp_terapis, gender_terapis, foto_terapis, inisial_terapis, status_terapis } = data;
  await pool.query(
    `UPDATE terapis SET nama_terapis=$2, no_hp_terapis=$3, gender_terapis=$4, foto_terapis=$5, inisial_terapis=$6, status_terapis=$7 WHERE id_terapis = $1`,
    [id_terapis, nama_terapis, no_hp_terapis, gender_terapis, foto_terapis, inisial_terapis, status_terapis]
  );
}

async function buatAlokasiTerapis({ id_terapis, id_cabang, waktu_berlaku, status_alokasi }) {
  await pool.query(
    `INSERT INTO alokasi_terapis (id_terapis, id_cabang, waktu_berlaku, status_alokasi) VALUES ($1,$2,$3,$4)`,
    [id_terapis, id_cabang, waktu_berlaku, status_alokasi]
  );
}

async function cabangTerapisTerbaru(id_terapis) {
  // Pastikan nama tabel ini benar
  const res = await pool.query(`SELECT * FROM alokasi_terapis WHERE id_terapis = $1 ORDER BY waktu_berlaku DESC LIMIT 1`, [id_terapis]);
  return res.rows[0];
}

module.exports = {
  daftarTerapis, cariTerapis, buatTerapis, perbaruiTerapis, buatAlokasiTerapis, cabangTerapisTerbaru,
  getKeahlianTerapis, hapusKeahlianTerapis, tambahKeahlianTerapis, daftarTerapisAktif,
  cekTerapisAktif
};