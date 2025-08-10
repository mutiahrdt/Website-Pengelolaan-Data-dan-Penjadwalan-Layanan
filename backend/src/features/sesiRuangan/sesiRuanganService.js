// file: backend/src/features/sesiRuangan/sesiRuanganService.js

const sesiRuanganModel = require('./sesiRuanganModel');
const { Logger } = require('../penjadwalan/utils/logger');

const logger = Logger('SesiRuanganService');

async function synchronizeSesiRuangan() {
  logger.info('Memulai proses sinkronisasi Sesi & Ruangan...');
  
  const [allSesi, ruanganByCabang] = await Promise.all([
    sesiRuanganModel.getAllSesi(),
    sesiRuanganModel.getAllRuanganByCabang()
  ]);

  if (allSesi.length === 0 || Object.keys(ruanganByCabang).length === 0) {
    logger.warn('Tidak ada Sesi atau Ruangan aktif yang ditemukan. Proses sinkronisasi dibatalkan.');
    return { inserted: 0, totalCombinations: 0 };
  }

  const dataToInsert = [];
  let totalCombinations = 0;

  for (const idCabang in ruanganByCabang) {
    const ruanganDiCabangIni = ruanganByCabang[idCabang];
    
    for (const idSesi of allSesi) {
      for (const idRuangan of ruanganDiCabangIni) {
        dataToInsert.push({ id_sesi: idSesi, id_ruangan: idRuangan });
        totalCombinations++;
      }
    }
  }

  const insertedCount = await sesiRuanganModel.syncSesiRuangan(dataToInsert);

  logger.info(`Proses sinkronisasi selesai. Total kombinasi seharusnya: ${totalCombinations}. Berhasil disisipkan: ${insertedCount}.`);
  
  return { inserted: insertedCount, totalCombinations };
}

module.exports = {
  synchronizeSesiRuangan
};