// file: backend/src/features/sesiRuangan/sesiRuanganModel.js (DIPERBAIKI)

const pool = require('../../utils/db');
const { Logger } = require('../penjadwalan/utils/logger');

const logger = Logger('SesiRuanganModel');

async function getAllSesi() {
  const { rows } = await pool.query("SELECT id_sesi FROM sesi WHERE status_sesi = true");
  return rows.map(r => r.id_sesi);
}

async function getAllRuanganByCabang() {
  const { rows } = await pool.query("SELECT id_ruangan, id_cabang FROM ruangan WHERE status_ruangan = true");
  const ruanganByCabang = {};
  for (const row of rows) {
    if (!ruanganByCabang[row.id_cabang]) {
      ruanganByCabang[row.id_cabang] = [];
    }
    ruanganByCabang[row.id_cabang].push(row.id_ruangan);
  }
  return ruanganByCabang;
}

async function syncSesiRuangan(dataToInsert) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE sesi_ruangan RESTART IDENTITY');

    if (dataToInsert.length === 0) {
      await client.query('COMMIT');
      return 0;
    }
    
    const values = dataToInsert.map(item => [item.id_sesi, item.id_ruangan]);
    const valuePlaceholders = values.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(',');
    
    const query = `
        INSERT INTO sesi_ruangan (id_sesi, id_ruangan) 
        VALUES ${valuePlaceholders}
        ON CONFLICT (id_sesi, id_ruangan) DO NOTHING;
    `;
    
    const flatValues = values.flat();
    const result = await client.query(query, flatValues);

    await client.query('COMMIT');
    return result.rowCount;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Gagal melakukan sinkronisasi sesi_ruangan:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function dapatkanSemua() {
  const { rows } = await pool.query('SELECT id_sesi, id_ruangan FROM sesi_ruangan');
  const validSlots = new Set();
  rows.forEach(row => {
    validSlots.add(`${row.id_sesi}-${row.id_ruangan}`);
  });
  return validSlots;
}

// =======================================================
// PERBAIKAN: Tambahkan `dapatkanSemua` ke module.exports
// =======================================================
module.exports = {
  getAllSesi,
  getAllRuanganByCabang,
  syncSesiRuangan,
  dapatkanSemua,
};