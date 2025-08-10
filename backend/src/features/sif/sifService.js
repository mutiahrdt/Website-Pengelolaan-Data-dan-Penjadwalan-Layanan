// file: backend/sif/sifLayanan.js (LENGKAP & DIPERBAIKI)

const model = require("./sifModel");
const { generateIdSif } = require("../../utils/generateId"); // Memanggil fungsi generator ID yang sudah diperbaiki

/**
 * Mengambil daftar semua sif dari model.
 * @returns {Promise<Array>} Daftar semua sif.
 */
async function daftarSif() {
  return await model.daftarSif();
}

/**
 * Layanan untuk membuat Sif baru.
 * Bertanggung jawab untuk validasi input dan mengorkestrasi pembuatan ID dan penyimpanan data.
 * @param {object} data - Data sif dari controller.
 * @param {string} data.nama_sif - Nama untuk sif baru.
 * @param {string} data.jam_mulai - Waktu mulai sif.
 * @param {string} data.jam_selesai - Waktu selesai sif.
 * @param {boolean} data.status_sif - Status aktif/nonaktif sif.
 * @returns {Promise<object>} Data sif yang berhasil dibuat.
 */
async function buatSif({ nama_sif, jam_mulai, jam_selesai, status_sif }) {
  // 1. Validasi input di service layer. Ini adalah praktik yang baik.
  if (!nama_sif || nama_sif.trim().length === 0 || !jam_mulai || !jam_selesai) {
    throw new Error("Nama Sif, Jam Mulai, dan Jam Selesai wajib diisi.");
  }

  // 2. Panggil generator ID yang sudah cerdas.
  // Jika generateIdSif gagal (misal: semua karakter sudah dipakai), error akan otomatis dilempar ke controller.
  const id_sif = await generateIdSif(nama_sif);

  // 3. Panggil fungsi model untuk menyimpan data ke database.
  // Menggunakan `!!` untuk memastikan status_sif adalah boolean murni (true/false).
  const sifBaru = await model.buatSif({ 
    id_sif, 
    nama_sif, 
    jam_mulai, 
    jam_selesai, 
    status_sif: !!status_sif 
  });
  
  return sifBaru;
}

/**
 * Layanan untuk memperbarui Sif yang sudah ada.
 * @param {object} data - Data sif untuk diperbarui.
 * @param {string} data.id_sif - ID dari sif yang akan diperbarui.
 * @param {string} data.nama_sif - Nama baru untuk sif.
 * @param {string} data.jam_mulai - Waktu mulai baru.
 * @param {string} data.jam_selesai - Waktu selesai baru.
 * @param {boolean} data.status_sif - Status baru.
 * @returns {Promise<object>} Data sif yang berhasil diperbarui.
 */
async function perbaruiSif({ id_sif, nama_sif, jam_mulai, jam_selesai, status_sif }) {
  // Validasi juga sangat penting untuk proses update.
  if (!id_sif || !nama_sif || nama_sif.trim().length === 0 || !jam_mulai || !jam_selesai) {
    throw new Error("Semua field wajib diisi untuk melakukan pembaruan.");
  }

  // Panggil model untuk melakukan update di database.
  const sifDiperbarui = await model.perbaruiSif({ 
    id_sif, 
    nama_sif, 
    jam_mulai, 
    jam_selesai, 
    status_sif: !!status_sif 
  });

  return sifDiperbarui;
}

module.exports = {
  daftarSif,
  buatSif,
  perbaruiSif,
};