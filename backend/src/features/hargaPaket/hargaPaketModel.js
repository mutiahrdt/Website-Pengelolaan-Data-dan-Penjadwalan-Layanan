// file: backend/hargaPaket/hargaPaketModel.js (LENGKAP & DIPERBAIKI)

const pool = require("../../utils/db");

function konversiHarga(rows) {
  return rows.map(row => ({
    ...row,
    harga_paket: row.harga_paket != null ? parseFloat(String(row.harga_paket).replace(/[^0-9.-]+/g, "")) : null,
  }));
}

async function tambahHargaPaket({ id_cabang, id_paket, harga_paket, waktu_berlaku, status_harga_paket = true }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Hanya nonaktifkan harga sebelumnya jika harga baru akan diaktifkan
    if (status_harga_paket === true) {
      await client.query(
        `UPDATE harga_paket SET status_harga_paket = FALSE WHERE id_cabang = $1 AND id_paket = $2 AND status_harga_paket = TRUE`,
        [id_cabang, id_paket]
      );
    }

    const res = await client.query(
      `INSERT INTO harga_paket (id_cabang, id_paket, harga_paket, waktu_berlaku, status_harga_paket) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [id_cabang, id_paket, harga_paket, waktu_berlaku, status_harga_paket]
    );

    await client.query('COMMIT');
    return res.rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function dapatkanHistoriHargaPaket(id_cabang, id_paket) {
  const res = await pool.query(
    `SELECT * FROM harga_paket WHERE id_cabang = $1 AND id_paket = $2 ORDER BY waktu_berlaku DESC`,
    [id_cabang, id_paket]
  );
  return konversiHarga(res.rows);
}

async function dapatkanDaftarHargaPaket(id_cabang) {
  let query = `
    WITH RankedHarga AS (
      SELECT 
        hp.*, 
        ROW_NUMBER() OVER(PARTITION BY hp.id_cabang, hp.id_paket ORDER BY hp.waktu_berlaku DESC) as rn
      FROM harga_paket hp
      WHERE hp.status_harga_paket = TRUE
    )
    SELECT 
      rh.id_cabang, rh.id_paket, rh.status_harga_paket, rh.waktu_berlaku, rh.harga_paket, 
      c.nama_cabang, 
      p.nama_paket, p.gambar_paket, p.durasi_paket, p.deskripsi_paket, p.kata_kunci
    FROM RankedHarga rh
    JOIN cabang c ON c.id_cabang = rh.id_cabang
    JOIN paket p ON p.id_paket = rh.id_paket
    WHERE rh.rn = 1 AND p.status_paket = TRUE
  `;

  const params = [];

  if (id_cabang) {
    query += ` AND rh.id_cabang = $1`;
    params.push(id_cabang);
  }

  query += ` ORDER BY c.nama_cabang, p.nama_paket;`;

  const res = await pool.query(query, params);
  return konversiHarga(res.rows);
}

module.exports = {
  tambahHargaPaket,
  dapatkanDaftarHargaPaket,
  dapatkanHistoriHargaPaket,
};