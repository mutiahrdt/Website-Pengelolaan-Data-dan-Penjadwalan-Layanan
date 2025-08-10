const model = require('./pasienModel');
const dayjs = require('dayjs');

/**
 * Service untuk mengambil semua data pasien.
 * Langsung memanggil model karena tidak ada validasi.
 */
const daftarPasien = async () => {
  return await model.daftarPasien();
};

/**
 * Service untuk membuat pasien baru.
 * Menerapkan validasi dari pseudocode 'buatPasien'.
 * @param {Object} data - Data dari request body.
 * @returns {Promise<Object>}
 */
const buatPasien = async (data) => {
  const { nama_pasien, no_hp_pasien, gender_pasien, tanggal_lahir } = data;

  // Validasi input wajib sesuai pseudocode
  if (!nama_pasien || !no_hp_pasien || !gender_pasien || !tanggal_lahir) {
    throw new Error("Error: Semua field wajib diisi.");
  }

  // Validasi tambahan untuk tipe data
  if (typeof nama_pasien !== 'string' || typeof no_hp_pasien !== 'string' || typeof gender_pasien !== 'string') {
     throw new Error("Error: Tipe data tidak sesuai.");
  }
   if (!dayjs(tanggal_lahir, 'YYYY-MM-DD').isValid()) {
    throw new Error("Error: Format tanggal lahir tidak valid. Gunakan format YYYY-MM-DD.");
  }

  // Jika validasi lolos, panggil model untuk membuat data
  return await model.buatPasien(data);
};

/**
 * Service untuk memperbarui data pasien.
 * Menerapkan validasi dari pseudocode 'perbaruiPasien'.
 * @param {string} id_pasien - ID dari URL params.
 * @param {Object} data - Data dari request body.
 * @returns {Promise<Object>}
 */
const perbaruiPasien = async (id_pasien, data) => {
  const { nama_pasien, no_hp_pasien, gender_pasien, tanggal_lahir } = data;

  // Validasi input wajib sesuai pseudocode
  if (!id_pasien || !nama_pasien || !no_hp_pasien || !gender_pasien || !tanggal_lahir) {
    throw new Error("Error: Semua field wajib diisi.");
  }

   // Validasi tambahan untuk tipe data
  if (typeof nama_pasien !== 'string' || typeof no_hp_pasien !== 'string' || typeof gender_pasien !== 'string') {
     throw new Error("Error: Tipe data tidak sesuai.");
  }
  if (!dayjs(tanggal_lahir, 'YYYY-MM-DD').isValid()) {
    throw new Error("Error: Format tanggal lahir tidak valid. Gunakan format YYYY-MM-DD.");
  }

  // Jika validasi lolos, panggil model untuk memperbarui data
  const hasil = await model.perbaruiPasien(id_pasien, data);
  if (!hasil) {
      throw new Error("Error: Pasien dengan ID tersebut tidak ditemukan untuk diperbarui.");
  }
  return hasil;
};

module.exports = {
  daftarPasien,
  buatPasien,
  perbaruiPasien,
};