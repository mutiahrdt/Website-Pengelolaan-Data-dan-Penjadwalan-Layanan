const pool = require('../../utils/db');
const { Logger } = require('./utils/logger');

const logger = Logger('PenjadwalanModel');

function getTriwulan(date) {
  const dateObj = new Date(date);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return `${year}Q${quarter}`;
}

async function findTerapisByName(namaTerapis) {
  const client = await pool.connect();
  try {
    const query = `SELECT id_terapis, nama_terapis, gender_terapis, inisial_terapis FROM terapis WHERE nama_terapis = $1 AND status_terapis = true LIMIT 1;`;
    const result = await client.query(query, [namaTerapis]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    logger.error('Error dalam findTerapisByName:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function getPaketDetails(packageId) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        p.id_paket, p.nama_paket, p.deskripsi_paket, p.kata_kunci,
        p.gambar_paket, p.durasi_paket, p.status_paket, p.id_keahlian,
        k.nama_keahlian, k.status_keahlian
      FROM paket p
      JOIN keahlian k ON p.id_keahlian = k.id_keahlian
      WHERE p.id_paket = $1 AND p.status_paket = true
    `;
    const result = await client.query(query, [packageId]);
    if (result.rows.length === 0) {
      throw new Error(`Paket dengan ID ${packageId} tidak ditemukan atau tidak aktif`);
    }
    return result.rows[0];
  } catch (error) {
    logger.error('Error dalam getPaketDetails:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function getAvailableTerapis(cabangId, date) {
  const client = await pool.connect();
  try {
    const dayName = new Date(date).toLocaleDateString('id-ID', { weekday: 'long' }).toLowerCase();
    const triwulan = getTriwulan(date);

    // Kueri ini SUDAH BENAR karena mengambil `waktu_kehadiran_aktual`
    const query = `
      SELECT
          t.id_terapis, t.nama_terapis, t.gender_terapis, t.inisial_terapis,
          jk.id_sif, jk.kuota_jam_kerja,
          s.nama_sif, s.jam_mulai AS sif_mulai, s.jam_selesai AS sif_selesai,
          -- Mengambil waktu kehadiran aktual sebagai string agar tidak ambigu
          TO_CHAR(kh.waktu_kehadiran, 'HH24:MI:SS') AS waktu_kehadiran_aktual,
          (SELECT array_agg(kt_sub.id_keahlian) 
           FROM keahlian_terapis kt_sub 
           WHERE kt_sub.id_terapis = t.id_terapis AND kt_sub.status_keahlian_terapis = true) AS keahlian_ids
      FROM 
          terapis t
      JOIN alokasi_terapis at ON t.id_terapis = at.id_terapis
      JOIN jam_kerja jk ON t.id_terapis = jk.id_terapis
      JOIN sif s ON jk.id_sif = s.id_sif
      -- Kondisi JOIN ke tabel kehadiran
      LEFT JOIN kehadiran kh ON t.id_terapis = kh.id_terapis AND kh.tanggal_kehadiran = $2::date
      WHERE 
          t.status_terapis = true
          AND at.id_cabang = $1 
          AND at.status_alokasi = true 
          AND at.waktu_berlaku = (
              SELECT MAX(at_inner.waktu_berlaku) 
              FROM alokasi_terapis at_inner 
              WHERE at_inner.id_terapis = t.id_terapis 
              AND at_inner.waktu_berlaku <= $2::date
          )
          AND jk.triwulan = $4 
          AND LOWER(jk.hari_kerja) = $3 
          AND jk.status_bekerja = true
          AND s.status_sif = true
          -- Penting: Hanya ambil terapis yang statusnya true (hadir) atau belum diisi (dianggap hadir)
          AND (kh.status_kehadiran IS NULL OR kh.status_kehadiran = true);
    `;
    
    const result = await client.query(query, [cabangId, date, dayName, triwulan]);
    return result.rows;

  } catch (error) {
    logger.error('Error dalam getAvailableTerapis:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function getAvailableRooms(cabangId, roomType) {
  const client = await pool.connect();
  try {
    let query = `
      SELECT r.id_ruangan, r.nama_ruangan, r.id_cabang, r.status_ruangan
      FROM ruangan r
      WHERE r.id_cabang = $1 AND r.status_ruangan = true
    `;
    const params = [cabangId];
    if (roomType === 'Onsite') {
      query += ` AND r.nama_ruangan NOT ILIKE '%Homecare%'`;
    } else if (roomType === 'Homecare') {
      query += ` AND r.nama_ruangan ILIKE '%Homecare%'`;
    }
    query += ` ORDER BY (CASE WHEN r.nama_ruangan ILIKE '%Homecare%' THEN 1 ELSE 0 END), r.nama_ruangan`;
    const result = await client.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error dalam getAvailableRooms:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function getOccupancy(date) {
  const client = await pool.connect();
  try {
    // [PERBAIKAN KUNCI] Ubah kondisi WHERE untuk status_jadwal
    const query = `
      SELECT id_sesi, id_terapis, id_ruangan 
      FROM jadwal 
      WHERE 
        tanggal_kehadiran = $1::date 
        AND status_jadwal IN ('Aktif', 'Terlaksana')
    `;
    const result = await client.query(query, [date]);
    
    // Inisialisasi peta okupansi
    const occupancy = { terapis: {}, ruangan: {} };
    for (let i = 1; i <= 12; i++) {
      const sesiId = `S${String(i).padStart(2, '0')}`;
      occupancy.terapis[sesiId] = new Set();
      occupancy.ruangan[sesiId] = new Set();
    }
    
    // Isi peta okupansi dengan data dari query
    result.rows.forEach(row => {
      if (row.id_sesi) { // Pastikan id_sesi tidak null
        if (row.id_terapis) occupancy.terapis[row.id_sesi].add(row.id_terapis);
        if (row.id_ruangan) occupancy.ruangan[row.id_sesi].add(row.id_ruangan);
      }
    });
    
    return occupancy;
  } catch (error) {
    logger.error('Error dalam getOccupancy:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function getTerapisWorkload(terapisIds, date, excludePesananId = null) {
    const client = await pool.connect();
    const workloadMap = new Map();
    if (!terapisIds || terapisIds.length === 0) {
        return workloadMap;
    }
    try {
        let query = `
            SELECT id_terapis, COUNT(id_sesi) as workload
            FROM jadwal
            WHERE tanggal_kehadiran = $1
              AND id_terapis = ANY($2::text[])
              AND status_jadwal = 'Aktif'
        `;
        const params = [date, terapisIds];
        if (excludePesananId) {
            query += ` AND id_pesanan != $3`;
            params.push(excludePesananId);
        }
        query += ` GROUP BY id_terapis;`;
        const result = await client.query(query, params);
        result.rows.forEach(row => {
            workloadMap.set(row.id_terapis, parseInt(row.workload, 10));
        });
        return workloadMap;
    } catch (error) {
        logger.error('Error dalam getTerapisWorkload:', error);
        throw error;
    } finally {
        client.release();
    }
}

async function createPesananAndJadwal(inputPenjadwalan, solusi) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const countQuery = `SELECT COUNT(*) FROM pesanan WHERE waktu_pijat = $1`;
    const countResult = await client.query(countQuery, [inputPenjadwalan.tanggal]);
    const increment = parseInt(countResult.rows[0].count, 10) + 1;
    const date = new Date(inputPenjadwalan.tanggal);
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}${month}${day}`;
    const idCabang = String(inputPenjadwalan.cabangId).padStart(2, '0');
    const incrementPadded = String(increment).padStart(2, '0');
    const idPesanan = `${formattedDate}${idCabang}${incrementPadded}`;
    const insertPesananQuery = `
      INSERT INTO pesanan (
        id_pesanan, id_paket, id_pasien, id_administratif, waktu_tempuh, jenis_ruangan, 
        preferensi_nama_terapis, waktu_pijat, preferensi_gender_terapis
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`;
    const pesananValues = [
      idPesanan, inputPenjadwalan.id_paket, inputPenjadwalan.id_pasien, inputPenjadwalan.id_admin, 
      inputPenjadwalan.waktu_tempuh || null, inputPenjadwalan.jenis_ruangan, inputPenjadwalan.preferensi?.nama_terapis || null, 
      inputPenjadwalan.tanggal, inputPenjadwalan.preferensi?.jenis_kelamin || null
    ];
    await client.query(insertPesananQuery, pesananValues);
    const insertJadwalQuery = `
      INSERT INTO jadwal (
        id_terapis, tanggal_kehadiran, id_sesi, id_ruangan, id_sif, id_pesanan, status_jadwal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
    for (const sesi of solusi.sesi_dipesan) {
      const jadwalValues = [
        solusi.id_terapis, inputPenjadwalan.tanggal, sesi.id_sesi, solusi.id_ruangan, solusi.id_sif, idPesanan, 'Aktif'
      ];
      await client.query(insertJadwalQuery, jadwalValues);
    }
    await client.query('COMMIT');
    return {
      id_pesanan: idPesanan, nama_terapis: solusi.nama_terapis, nama_ruangan: solusi.nama_ruangan,
      tanggal: solusi.tanggal, sesi_dipesan: solusi.sesi_dipesan, jumlah_sesi: solusi.jumlah_sesi
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error dalam createPesananAndJadwal:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function getPesananDanJadwal(idPesanan) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 
        p.*, t.nama_terapis,
        aa.id_cabang,
        json_agg(
          json_build_object(
            'id_sesi', j.id_sesi, 'id_terapis', j.id_terapis, 'id_ruangan', j.id_ruangan, 
            'id_sif', j.id_sif, 'status_jadwal', j.status_jadwal, 'tanggal_kehadiran', j.tanggal_kehadiran,
            'nama_terapis', t.nama_terapis
          ) ORDER BY j.id_sesi
        ) as jadwal_lama
      FROM pesanan p
      JOIN alokasi_admin aa ON p.id_administratif = aa.id_administratif
      LEFT JOIN jadwal j ON p.id_pesanan = j.id_pesanan
      LEFT JOIN terapis t ON j.id_terapis = t.id_terapis
      WHERE p.id_pesanan = $1 AND aa.status_alokasi = true AND aa.waktu_berlaku <= NOW()
      GROUP BY p.id_pesanan, t.nama_terapis, aa.id_cabang, aa.waktu_berlaku
      ORDER BY aa.waktu_berlaku DESC
      LIMIT 1;
    `;
    const result = await client.query(query, [idPesanan]);
    if (result.rows.length === 0) {
      throw new Error(`Pesanan dengan ID ${idPesanan} tidak ditemukan atau admin tidak memiliki akses.`);
    }
    return result.rows[0];
  } catch (error) {
    logger.error('Error dalam getPesananDanJadwal:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function updatePesananDanJadwal(idPesanan, inputBaru, solusiBaru) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updateFields = []; const updateValues = []; let valueIndex = 1;
    if (inputBaru.id_paket) { updateFields.push(`id_paket = $${valueIndex++}`); updateValues.push(inputBaru.id_paket); }
    if (inputBaru.tanggal) { updateFields.push(`waktu_pijat = $${valueIndex++}`); updateValues.push(inputBaru.tanggal); }
    if (inputBaru.jenis_ruangan) { updateFields.push(`jenis_ruangan = $${valueIndex++}`); updateValues.push(inputBaru.jenis_ruangan); }
    if (inputBaru.waktu_tempuh !== undefined) { updateFields.push(`waktu_tempuh = $${valueIndex++}`); updateValues.push(inputBaru.waktu_tempuh); }
    if (inputBaru.preferensi?.nama_terapis !== undefined) { updateFields.push(`preferensi_nama_terapis = $${valueIndex++}`); updateValues.push(inputBaru.preferensi.nama_terapis); }
    if (inputBaru.preferensi?.jenis_kelamin !== undefined) { updateFields.push(`preferensi_gender_terapis = $${valueIndex++}`); updateValues.push(inputBaru.preferensi.jenis_kelamin); }
    if (updateFields.length > 0) {
      const updatePesananQuery = `UPDATE pesanan SET ${updateFields.join(', ')} WHERE id_pesanan = $${valueIndex}`;
      updateValues.push(idPesanan);
      await client.query(updatePesananQuery, updateValues);
    }
    await client.query('DELETE FROM jadwal WHERE id_pesanan = $1', [idPesanan]);
    const insertJadwalQuery = `
      INSERT INTO jadwal (
        id_terapis, tanggal_kehadiran, id_sesi, id_ruangan, id_sif, id_pesanan, status_jadwal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
    for (const sesi of solusiBaru.sesi_dipesan) {
      const jadwalValues = [ 
          solusiBaru.id_terapis, inputBaru.tanggal, sesi.id_sesi, solusiBaru.id_ruangan, 
          solusiBaru.id_sif, idPesanan, 'Aktif'
      ];
      await client.query(insertJadwalQuery, jadwalValues);
    }
    await client.query('COMMIT');
    return {
      id_pesanan: idPesanan, nama_terapis: solusiBaru.nama_terapis, nama_ruangan: solusiBaru.nama_ruangan,
      tanggal: solusiBaru.tanggal, sesi_dipesan: solusiBaru.sesi_dipesan, jumlah_sesi: solusiBaru.jumlah_sesi
    };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error dalam updatePesananDanJadwal:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function getBookingsForDay(date, cabangId) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT
        p.id_pesanan, j.id_sesi AS id_sesi_mulai, j.id_ruangan,
        r.nama_ruangan, j.id_terapis, t.nama_terapis, t.inisial_terapis,
        p.id_pasien, ps.nama_pasien, p.id_paket, p.waktu_tempuh, p.jenis_ruangan
      FROM jadwal j
      JOIN pesanan p ON j.id_pesanan = p.id_pesanan
      JOIN pasien ps ON p.id_pasien = ps.id_pasien
      JOIN terapis t ON j.id_terapis = t.id_terapis
      JOIN ruangan r ON j.id_ruangan = r.id_ruangan
      JOIN alokasi_terapis at ON t.id_terapis = at.id_terapis
      WHERE j.tanggal_kehadiran = $1::date
        AND at.id_cabang = $2
        AND j.status_jadwal = 'Aktif'
        AND at.status_alokasi = true
        AND at.waktu_berlaku <= NOW()
      GROUP BY p.id_pesanan, j.id_sesi, j.id_ruangan, r.nama_ruangan, j.id_terapis, t.nama_terapis, t.inisial_terapis, p.id_pasien, ps.nama_pasien, p.id_paket, p.waktu_tempuh, p.jenis_ruangan;
    `;
    const result = await client.query(query, [date, cabangId]);
    return result.rows;
  } catch (error) {
    logger.error('Error dalam getBookingsForDay:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function getUpcomingBookings(cabangId) {
  const client = await pool.connect();
  try {
    const query = `
      WITH JadwalAwal AS (
          SELECT 
              id_pesanan,
              MIN(id_sesi) as sesi_pertama
          FROM jadwal
          WHERE status_jadwal = 'Aktif'
          GROUP BY id_pesanan
      )
      SELECT
          p.id_pesanan, 
          p.waktu_pijat, 
          ps.nama_pasien, 
          t.nama_terapis,
          s.jam_mulai,
          -- [PENAMBAHAN] Ambil kolom nama_paket dan jenis_ruangan
          pk.nama_paket,
          p.jenis_ruangan
      FROM pesanan p
      JOIN JadwalAwal ja ON p.id_pesanan = ja.id_pesanan
      JOIN jadwal j ON ja.id_pesanan = j.id_pesanan AND ja.sesi_pertama = j.id_sesi
      JOIN sesi s ON j.id_sesi = s.id_sesi
      JOIN pasien ps ON p.id_pasien = ps.id_pasien
      JOIN terapis t ON j.id_terapis = t.id_terapis
      -- [PENAMBAHAN] Join ke tabel paket untuk mendapatkan nama paket
      JOIN paket pk ON p.id_paket = pk.id_paket
      JOIN alokasi_terapis at ON t.id_terapis = at.id_terapis AND at.id_cabang = $1
      WHERE 
          (p.waktu_pijat::date + s.jam_mulai)::timestamp AT TIME ZONE 'Asia/Jakarta' >= NOW()
      ORDER BY (p.waktu_pijat::date + s.jam_mulai) ASC;
    `;
    const result = await client.query(query, [cabangId]);
    return result.rows;
  } catch (error) {
    logger.error('Error dalam getUpcomingBookings:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function cancelBooking(id_pesanan, newStatus) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const updateJadwalQuery = `UPDATE jadwal SET status_jadwal = $1 WHERE id_pesanan = $2`;
    await client.query(updateJadwalQuery, [newStatus, id_pesanan]);
    await client.query('COMMIT');
    return { success: true, message: `Pesanan ${id_pesanan} berhasil dibatalkan.` };
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Error saat membatalkan pesanan:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * [FUNGSI BARU]
 * Mengambil daftar pesanan aktif untuk seorang terapis pada tanggal tertentu.
 * Digunakan untuk menemukan jadwal yang terdampak saat terapis tidak hadir.
 * @param {string} id_terapis - ID terapis yang bersangkutan.
 * @param {string} tanggal - Tanggal dalam format YYYY-MM-DD.
 * @returns {Array<object>} - Daftar pesanan yang terdampak, contoh: [{ id_pesanan: '...' }]
 */
async function getActiveBookingsByTherapist(id_terapis, tanggal) {
  const client = await pool.connect();
  try {
    const query = `
      SELECT DISTINCT p.id_pesanan
      FROM pesanan p
      JOIN jadwal j ON p.id_pesanan = j.id_pesanan
      WHERE j.id_terapis = $1
        AND j.tanggal_kehadiran = $2::date
        AND j.status_jadwal = 'Aktif'
    `;
    const { rows } = await client.query(query, [id_terapis, tanggal]);
    return rows;
  } catch (error) {
    logger.error('Error in getActiveBookingsByTherapist:', error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getPaketDetails,
  getAvailableTerapis,
  getAvailableRooms,
  getOccupancy,
  createPesananAndJadwal,
  getPesananDanJadwal,
  updatePesananDanJadwal,
  getTerapisWorkload,
  findTerapisByName,
  getBookingsForDay,
  getUpcomingBookings,
  cancelBooking,
  getActiveBookingsByTherapist,
};