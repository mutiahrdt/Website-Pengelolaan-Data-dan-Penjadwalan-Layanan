// file: backend/models/kehadiran/kehadiranModel.js (FINAL)

const pool = require("../../utils/db");

/**
 * Membuat satu entri KEHADIRAN. Dipanggil oleh jamKerjaService.
 * @param {object} data - Data lengkap untuk satu baris kehadiran.
 */
async function buat(data) {
  const { tanggal_kehadiran, id_terapis, id_sif, hari_kerja, triwulan, status_kehadiran, waktu_kehadiran, keterangan_kehadiran } = data;
  const query = `
    INSERT INTO KEHADIRAN (
      TANGGAL_KEHADIRAN, ID_TERAPIS, ID_SIF, HARI_KERJA, TRIWULAN,
      STATUS_KEHADIRAN, WAKTU_KEHADIRAN, KETERANGAN_KEHADIRAN
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (TANGGAL_KEHADIRAN, ID_TERAPIS) DO NOTHING;
  `;
  // ON CONFLICT digunakan untuk mencegah error jika jamKerjaService dijalankan ulang
  await pool.query(query, [tanggal_kehadiran, id_terapis, id_sif, hari_kerja, triwulan, status_kehadiran, waktu_kehadiran, keterangan_kehadiran]);
}

/**
 * Memperbarui entri KEHADIRAN yang ada berdasarkan Primary Key.
 * @param {object} data - { tanggal_kehadiran, id_terapis, status_kehadiran, waktu_kehadiran, keterangan_kehadiran }
 * @returns {object} - Record yang telah diperbarui.
 */
async function perbarui(data) {
  const { tanggal_kehadiran, id_terapis, status_kehadiran, waktu_kehadiran, keterangan_kehadiran } = data;
  const query = `
    UPDATE KEHADIRAN SET
      STATUS_KEHADIRAN = $3,
      WAKTU_KEHADIRAN = $4,
      KETERANGAN_KEHADIRAN = $5
    WHERE TANGGAL_KEHADIRAN = $1 AND ID_TERAPIS = $2
    RETURNING *;
  `;
  const { rows } = await pool.query(query, [tanggal_kehadiran, id_terapis, status_kehadiran, waktu_kehadiran, keterangan_kehadiran]);
  return rows[0];
}

/**
 * Mengambil daftar jadwal terapis pada tanggal tertentu.
 * Menggunakan LEFT JOIN dari JAM_KERJA untuk memastikan semua yang terjadwal muncul.
 * @param {string} tanggal - Tanggal dalam format YYYY-MM-DD
 * @returns {Array<object>} - Daftar jadwal kehadiran.
 */
async function daftarBerdasarkanTanggal(tanggal) {
  const query = `
    SELECT
      t.ID_TERAPIS, t.NAMA_TERAPIS, t.INISIAL_TERAPIS,
      s.ID_SIF, s.NAMA_SIF, 
      -- Format jam mulai sif untuk konsistensi
      TO_CHAR(s.JAM_MULAI, 'HH24:MI:SS') as JAM_MULAI,
      jk.HARI_KERJA, jk.TRIWULAN,
      k.TANGGAL_KEHADIRAN,
      k.STATUS_KEHADIRAN,
      -- --- PERBAIKAN UTAMA DI SINI ---
      -- Format waktu kehadiran menjadi string HH:mm:ss agar tidak ambigu
      TO_CHAR(k.WAKTU_KEHADIRAN, 'HH24:MI:SS') as WAKTU_KEHADIRAN,
      k.KETERANGAN_KEHADIRAN
    FROM JAM_KERJA jk
    JOIN TERAPIS t ON jk.ID_TERAPIS = t.ID_TERAPIS
    JOIN SIF s ON jk.ID_SIF = s.ID_SIF
    LEFT JOIN KEHADIRAN k ON jk.ID_TERAPIS = k.ID_TERAPIS AND k.TANGGAL_KEHADIRAN = $1::date
    WHERE 
      (CASE LOWER(jk.HARI_KERJA)
          WHEN 'minggu' THEN 0 WHEN 'senin' THEN 1 WHEN 'selasa' THEN 2
          WHEN 'rabu' THEN 3 WHEN 'kamis' THEN 4 WHEN 'jumat' THEN 5
          WHEN 'sabtu' THEN 6
      END) = EXTRACT(DOW FROM $1::date)
      AND $1::date >= make_date(CAST(SUBSTRING(jk.triwulan, 1, 4) AS INTEGER), (CAST(SUBSTRING(jk.triwulan, 6, 1) AS INTEGER) - 1) * 3 + 1, 1)
      AND $1::date < (make_date(CAST(SUBSTRING(jk.triwulan, 1, 4) AS INTEGER), (CAST(SUBSTRING(jk.triwulan, 6, 1) AS INTEGER) - 1) * 3 + 1, 1) + INTERVAL '3 months')
      AND jk.STATUS_BEKERJA = TRUE
      AND t.STATUS_TERAPIS = TRUE
    ORDER BY s.JAM_MULAI ASC, t.NAMA_TERAPIS ASC;
  `;
  const { rows } = await pool.query(query, [tanggal]);
  return rows;
}

module.exports = { buat, perbarui, daftarBerdasarkanTanggal };