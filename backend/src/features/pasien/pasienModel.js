const pool = require('../../utils/db');
const { generateIdPasien } = require('../../utils/generateId'); // Pastikan path ini benar

/**
 * Mengambil semua data pasien dari database, diurutkan dari yang terbaru.
 * Sesuai dengan pseudocode 'daftarPasien'.
 * @returns {Promise<Array>} Array berisi objek pasien.
 */
const daftarPasien = async () => {
  const query = `
    SELECT 
      ID_PASIEN, 
      NAMA_PASIEN, 
      NO_HP_PASIEN, 
      GENDER_PASIEN, 
      TO_CHAR(TANGGAL_LAHIR, 'YYYY-MM-DD') as tanggal_lahir 
    FROM PASIEN 
    ORDER BY ID_PASIEN DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
};

/**
 * Menambahkan pasien baru ke database.
 * Sesuai dengan pseudocode 'buatPasien'.
 * @param {Object} data - Data pasien yang akan ditambahkan.
 * @returns {Promise<Object>} Objek pasien yang baru dibuat.
 */
const buatPasien = async (data) => {
  const { nama_pasien, no_hp_pasien, gender_pasien, tanggal_lahir } = data;
  
  // Memanggil fungsi generator ID dari pseudocode 'generateIdPasien'
  const id_pasien = await generateIdPasien(); 

  const query = `
    INSERT INTO PASIEN (ID_PASIEN, NAMA_PASIEN, NO_HP_PASIEN, GENDER_PASIEN, TANGGAL_LAHIR) 
    VALUES ($1, $2, $3, $4, $5) 
    RETURNING 
      ID_PASIEN, 
      NAMA_PASIEN, 
      NO_HP_PASIEN, 
      GENDER_PASIEN, 
      TO_CHAR(TANGGAL_LAHIR, 'YYYY-MM-DD') as tanggal_lahir
  `;
  const { rows } = await pool.query(query, [id_pasien, nama_pasien, no_hp_pasien, gender_pasien, tanggal_lahir]);
  return rows[0];
};

/**
 * Memperbarui data pasien yang ada di database.
 * Sesuai dengan pseudocode 'perbaruiPasien'.
 * @param {string} id_pasien - ID Pasien yang akan diperbarui.
 * @param {Object} data - Data baru untuk pasien.
 * @returns {Promise<Object|null>} Objek pasien yang telah diperbarui, atau null jika tidak ada.
 */
const perbaruiPasien = async (id_pasien, data) => {
  const { nama_pasien, no_hp_pasien, gender_pasien, tanggal_lahir } = data;
  const query = `
    UPDATE PASIEN SET 
      NAMA_PASIEN = $2, 
      NO_HP_PASIEN = $3, 
      GENDER_PASIEN = $4, 
      TANGGAL_LAHIR = $5
    WHERE ID_PASIEN = $1
    RETURNING 
      ID_PASIEN, 
      NAMA_PASIEN, 
      NO_HP_PASIEN, 
      GENDER_PASIEN, 
      TO_CHAR(TANGGAL_LAHIR, 'YYYY-MM-DD') as tanggal_lahir
  `;
  const { rows } = await pool.query(query, [id_pasien, nama_pasien, no_hp_pasien, gender_pasien, tanggal_lahir]);
  return rows[0] || null;
};

module.exports = {
  daftarPasien,
  buatPasien,
  perbaruiPasien,
};