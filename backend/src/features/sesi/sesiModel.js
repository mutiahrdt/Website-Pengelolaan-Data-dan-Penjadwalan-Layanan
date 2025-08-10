// file: backend/src/features/sesi/sesiModel.js (Lengkap dengan Penambahan)

const pool = require("../../utils/db");

// --- FUNGSI HELPER YANG DIPERBAIKI ---
async function getActiveRoomsByCabang(client, id_cabang) {
  const res = await client.query(
    "SELECT id_ruangan FROM ruangan WHERE id_cabang = $1 AND status_ruangan = true",
    [id_cabang]
  );
  return res.rows.map(row => row.id_ruangan);
}

async function daftarSesi() {
  const res = await pool.query(`
    SELECT s.*, c.nama_cabang
    FROM sesi s
    LEFT JOIN cabang c ON s.id_cabang = c.id_cabang
    ORDER BY s.id_sesi
  `);
  return res.rows;
}

// --- [FUNGSI BARU YANG DITAMBAHKAN] ---
/**
 * Mengambil detail satu sesi berdasarkan ID-nya.
 * Dibutuhkan oleh kehadiranService untuk memeriksa jam mulai sesi.
 * @param {string} id_sesi - ID Sesi (e.g., 'S01')
 * @returns {object|null} - Objek detail sesi atau null jika tidak ditemukan.
 */
async function getById(id_sesi) {
  const query = `SELECT * FROM SESI WHERE ID_SESI = $1`;
  const { rows } = await pool.query(query, [id_sesi]);
  // Mengembalikan baris pertama atau null jika tidak ada hasil
  return rows[0] || null;
}
// --- [AKHIR FUNGSI BARU] ---


async function buatSesi({ id_sesi, id_cabang, nama_sesi, jam_mulai, jam_selesai, status_sesi }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const insertSesiQuery = `
      INSERT INTO sesi (id_sesi, id_cabang, nama_sesi, jam_mulai, jam_selesai, status_sesi)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await client.query(insertSesiQuery, [id_sesi, id_cabang, nama_sesi, jam_mulai, jam_selesai, status_sesi]);
    
    if (status_sesi) {
        const ruanganDiCabang = await getActiveRoomsByCabang(client, id_cabang);
        if (ruanganDiCabang.length > 0) {
          const insertSesiRuanganQuery = `
            INSERT INTO sesi_ruangan (id_sesi, id_ruangan)
            VALUES ($1, $2)
          `;
          for (const id_ruangan of ruanganDiCabang) {
            await client.query(insertSesiRuanganQuery, [id_sesi, id_ruangan]);
          }
        }
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Error dalam membuat sesi dan izin ruangan, transaksi di-rollback:", error);
    throw error;
  } finally {
    client.release();
  }
}

async function perbaruiSesi({ id_sesi, nama_sesi, jam_mulai, jam_selesai, status_sesi }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const sesiUpdateRes = await client.query(
      `UPDATE sesi SET nama_sesi=$2, jam_mulai=$3, jam_selesai=$4, status_sesi=$5 WHERE id_sesi=$1 RETURNING id_cabang`,
      [id_sesi, nama_sesi, jam_mulai, jam_selesai, status_sesi]
    );
    const { id_cabang } = sesiUpdateRes.rows[0];

    if (status_sesi === true) {
      const newRooms = await getActiveRoomsByCabang(client, id_cabang);
      const oldRoomsRes = await client.query('SELECT id_ruangan FROM sesi_ruangan WHERE id_sesi = $1', [id_sesi]);
      const oldRooms = oldRoomsRes.rows.map(r => r.id_ruangan);
      const roomsToAdd = newRooms.filter(r => !oldRooms.includes(r));
      
      if (roomsToAdd.length > 0) {
        console.log(`Menambahkan ${roomsToAdd.length} relasi ruangan baru untuk sesi ${id_sesi}.`);
        const insertQuery = 'INSERT INTO sesi_ruangan (id_sesi, id_ruangan) VALUES ($1, $2)';
        for (const id_ruangan of roomsToAdd) {
          await client.query(insertQuery, [id_sesi, id_ruangan]);
        }
      } else {
        console.log(`Tidak ada relasi ruangan baru yang perlu ditambahkan untuk sesi ${id_sesi}.`);
      }
    }

    await client.query('COMMIT');
    console.log(`Sesi ${id_sesi} berhasil diperbarui.`);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error saat memperbarui sesi ${id_sesi}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  daftarSesi,
  buatSesi,
  perbaruiSesi,
  getById, 
};