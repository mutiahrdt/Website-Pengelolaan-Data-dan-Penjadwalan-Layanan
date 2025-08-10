const pool = require('../../utils/db');

/**
 * PERBAIKAN: Fungsi ini sekarang mengambil daftar pasien unik beserta informasi jadwal TERAKHIR mereka,
 * terlepas dari status jadwal tersebut.
 */
const daftarSemuaJadwalPasien = async () => {
  // CTE (Common Table Expression) untuk memberi nomor pada setiap jadwal pasien,
  // diurutkan dari yang terbaru.
  const query = `
    WITH RankedJadwal AS (
      SELECT
        p.ID_PASIEN,
        p.ID_PESANAN,
        j.TANGGAL,
        j.STATUS_JADWAL,
        ROW_NUMBER() OVER(PARTITION BY p.ID_PASIEN ORDER BY j.TANGGAL DESC, p.ID_PESANAN DESC) as rn
      FROM PESANAN p
      JOIN JADWAL j ON p.ID_PESANAN = j.ID_PESANAN
    )
    SELECT
      pa.ID_PASIEN AS kode_pasien,
      pa.NAMA_PASIEN AS nama_pasien,
      rj.ID_PESANAN AS id_pesanan, -- ID Pesanan dari jadwal terakhir untuk tombol "Lihat"
      rj.TANGGAL AS tanggal_terakhir,
      rj.STATUS_JADWAL AS status_terakhir
    FROM PASIEN pa
    LEFT JOIN RankedJadwal rj ON pa.ID_PASIEN = rj.ID_PASIEN AND rj.rn = 1 -- Hanya ambil jadwal yang paling baru
    ORDER BY
      pa.NAMA_PASIEN ASC;
  `;
  const { rows } = await pool.query(query);
  return rows;
};

/**
 * Mengambil detail transaksi DAN riwayat ID pesanan lain dari pasien yang sama.
 */
const getDetailByIdPesanan = async (id_pesanan) => {
  const pasienRes = await pool.query(`SELECT ID_PASIEN FROM PESANAN WHERE ID_PESANAN = $1`, [id_pesanan]);
  if (pasienRes.rowCount === 0) return null;
  const id_pasien = pasienRes.rows[0].id_pasien;

  const riwayatRes = await pool.query(
    `SELECT p.ID_PESANAN FROM PESANAN p
     JOIN JADWAL j ON p.ID_PESANAN = j.ID_PESANAN
     WHERE p.ID_PASIEN = $1 AND j.STATUS_JADWAL = 'Terlaksana'
     ORDER BY j.TANGGAL DESC, j.ID_SESI DESC`,
    [id_pasien]
  );
  const riwayat_pesanan = riwayatRes.rows.map(row => row.id_pesanan);

  const detailQuery = `
    SELECT
        j.TANGGAL, j.STATUS_JADWAL, s.NAMA_SESI, p.JENIS_RUANGAN,
        pa.ID_PASIEN, pa.NAMA_PASIEN, p.ID_PESANAN,
        t.NAMA_TERAPIS, pkt.NAMA_PAKET,
        jsonb_agg(
            jsonb_build_object(
                'id_form', rf.ID_FORM,
                'nama_form', rf.NAMA_FORM, 'tipe_data', rf.TIPE_DATA,
                'satuan', rf.SATUAN, 'nilai_char', th.NILAI_CHAR,
                'nilai_numerik', th.NILAI_NUMERIK
            )
        ) FILTER (WHERE th.ID_FORM IS NOT NULL) AS transaksi_items
    FROM JADWAL j
    LEFT JOIN PESANAN p ON j.ID_PESANAN = p.ID_PESANAN
    LEFT JOIN PASIEN pa ON p.ID_PASIEN = pa.ID_PASIEN
    LEFT JOIN KEHADIRAN k ON j.ID_KEHADIRAN = k.ID_KEHADIRAN
    LEFT JOIN TERAPIS t ON k.ID_TERAPIS = t.ID_TERAPIS
    LEFT JOIN SESI s ON j.ID_SESI = s.ID_SESI
    LEFT JOIN PAKET pkt ON p.ID_PAKET = pkt.ID_PAKET
    LEFT JOIN TRANSAKSI_HARIAN th ON j.ID_PESANAN = th.ID_PESANAN
    LEFT JOIN REFERENSI_FORM rf ON th.ID_FORM = rf.ID_FORM
    WHERE j.ID_PESANAN = $1
    GROUP BY j.TANGGAL, j.STATUS_JADWAL, s.NAMA_SESI, p.JENIS_RUANGAN,
             pa.ID_PASIEN, pa.NAMA_PASIEN, p.ID_PESANAN, t.NAMA_TERAPIS, pkt.NAMA_PAKET;
  `;
  const detailRes = await pool.query(detailQuery, [id_pesanan]);
  if (detailRes.rowCount === 0) return null;

  const fotoTerbaruQuery = `
    SELECT th.NILAI_CHAR
    FROM TRANSAKSI_HARIAN th
    JOIN PESANAN p ON th.ID_PESANAN = p.ID_PESANAN
    JOIN JADWAL j ON p.ID_PESANAN = j.ID_PESANAN
    JOIN REFERENSI_FORM rf ON th.ID_FORM = rf.ID_FORM
    WHERE p.ID_PASIEN = $1
      AND rf.NAMA_FORM = 'Foto Pasien'
      AND th.NILAI_CHAR IS NOT NULL AND th.NILAI_CHAR != ''
    ORDER BY j.TANGGAL DESC, j.ID_SESI DESC
    LIMIT 1;
  `;
  const fotoTerbaruRes = await pool.query(fotoTerbaruQuery, [id_pasien]);
  const foto_terbaru = fotoTerbaruRes.rows.length > 0 ? fotoTerbaruRes.rows[0].nilai_char : null;

  return {
    detail: detailRes.rows[0],
    riwayat_pesanan: riwayat_pesanan,
    foto_terbaru: foto_terbaru
  };
};

const tambahAtauPerbarui = async (data) => {
  const { id_pesanan, id_form, nilai_char, nilai_numerik } = data;
  const jadwalKeysRes = await pool.query(`SELECT ID_KEHADIRAN, ID_ADMINISTRATIF, ID_SESI, ID_RUANGAN, ID_SIF FROM JADWAL WHERE ID_PESANAN = $1 LIMIT 1`, [id_pesanan]);
  if (jadwalKeysRes.rowCount === 0) throw new Error("Jadwal tidak ditemukan");
  const jadwalKeys = jadwalKeysRes.rows[0];
  const query = `
    INSERT INTO TRANSAKSI_HARIAN (ID_KEHADIRAN, ID_ADMINISTRATIF, ID_SESI, ID_RUANGAN, ID_SIF, ID_PESANAN, ID_FORM, NILAI_NUMERIK, NILAI_CHAR, STATUS_SIMPAN) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, TRUE)
    ON CONFLICT (ID_KEHADIRAN, ID_ADMINISTRATIF, ID_SESI, ID_RUANGAN, ID_SIF, ID_PESANAN, ID_FORM) 
    DO UPDATE SET NILAI_NUMERIK = EXCLUDED.NILAI_NUMERIK, NILAI_CHAR = EXCLUDED.NILAI_CHAR, STATUS_SIMPAN = TRUE
    RETURNING *;
  `;
  const values = [jadwalKeys.id_kehadiran, jadwalKeys.id_administratif, jadwalKeys.id_sesi, jadwalKeys.id_ruangan, jadwalKeys.id_sif, id_pesanan, id_form, nilai_numerik, nilai_char];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const getJadwalOptions = async () => {
  const query = `SELECT j.ID_PESANAN as value, (pa.NAMA_PASIEN || ' - ' || TO_CHAR(j.TANGGAL, 'DD Mon YYYY') || ' - ' || s.NAMA_SESI) as label FROM JADWAL j JOIN PESANAN p ON j.ID_PESANAN = p.ID_PESANAN JOIN PASIEN pa ON p.ID_PASIEN = pa.ID_PASIEN JOIN SESI s ON j.ID_SESI = s.ID_SESI WHERE j.STATUS_JADWAL = 'Terlaksana' ORDER BY j.TANGGAL DESC;`;
  const { rows } = await pool.query(query);
  return rows;
};

const getFormOptions = async () => {
  const query = `SELECT ID_FORM as value, NAMA_FORM as label, TIPE_DATA as "tipeData" FROM REFERENSI_FORM ORDER BY NAMA_FORM ASC;`;
  const { rows } = await pool.query(query);
  return rows;
};

const getJadwalTerakhirPasien = async (id_pasien) => {
  const query = `
    SELECT j.STATUS_JADWAL, p.ID_PESANAN FROM JADWAL j JOIN PESANAN p ON j.ID_PESANAN = p.ID_PESANAN
    WHERE p.ID_PASIEN = $1 ORDER BY j.TANGGAL DESC, p.ID_PESANAN DESC LIMIT 1;
  `;
  const { rows } = await pool.query(query, [id_pasien]);
  return rows[0];
};

module.exports = {
  daftarSemuaJadwalPasien, // Nama fungsi baru
  getDetailByIdPesanan,
  tambahAtauPerbarui,
  getJadwalOptions,
  getFormOptions,
  getJadwalTerakhirPasien,
};