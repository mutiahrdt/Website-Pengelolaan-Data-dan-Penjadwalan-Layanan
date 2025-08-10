/**
 * Terapis Service
 * 
 * Tanggung Jawab:
 * - Menangani logika bisnis untuk data terapis.
 * - Melakukan validasi data sebelum dikirim ke model.
 * - Memastikan integritas data dengan memvalidasi relasi ke entitas lain (Cabang, Keahlian).
 * - Mengkoordinasikan beberapa operasi model (misal: buat terapis, lalu alokasi cabang, lalu tambah keahlian).
 */

// Impor model yang dibutuhkan
const terapisModel = require("./terapisModel");
const cabangModel = require("../cabang/cabangModel");
const keahlianPaketModel = require("../keahlianPaket/keahlianPaketModel");

// Impor utilities
const { simpanFoto } = require("../../utils/uploadFoto");
const { generateIdTerapis } = require("../../utils/generateId");
const generateInitial = require("../../utils/generateInitial");

/**
 * Mengambil daftar semua terapis beserta detail relasinya.
 * Digunakan untuk halaman manajemen terapis.
 * @returns {Promise<Array>} Daftar semua terapis.
 */
async function daftarTerapis() {
  return await terapisModel.daftarTerapis();
}

/**
 * Mengambil daftar terapis yang statusnya AKTIF.
 * Digunakan untuk fitur lain yang memerlukan pilihan terapis (misal: booking, penjadwalan).
 * @returns {Promise<Array>} Daftar terapis yang aktif.
 */
async function daftarTerapisAktif() {
  return await terapisModel.daftarTerapisAktif();
}

/**
 * Membuat data terapis baru.
 * Melakukan validasi terhadap cabang dan keahlian yang dipilih.
 * @param {object} data - Data terapis dari controller.
 * @returns {Promise<void>}
 */
async function buatTerapis({ nama_terapis, no_hp_terapis, gender_terapis, foto, id_cabang, status_terapis, wkt_berlaku, keahlian_ids }) {
  // 1. Validasi Input Dasar
  if (!nama_terapis || !no_hp_terapis || !gender_terapis || !id_cabang || typeof status_terapis === "undefined") {
    throw new Error("Semua field wajib diisi (nama, no hp, gender, cabang, status).");
  }

  // 2. Validasi Relasi (Aturan Bisnis Soft-Delete)
  if (!(await cabangModel.cekCabangAktif(id_cabang))) {
    throw new Error("Cabang yang dipilih tidak ditemukan atau tidak aktif.");
  }
  
  if (keahlian_ids && Array.isArray(keahlian_ids) && keahlian_ids.length > 0) {
    for (const id_keahlian of keahlian_ids) {
      if (!(await keahlianPaketModel.cekKeahlianAktif(id_keahlian))) {
        throw new Error(`Salah satu keahlian yang dipilih tidak ditemukan atau tidak aktif.`);
      }
    }
  }

  // 3. Proses Data
  const id_terapis = await generateIdTerapis();
  const inisial_terapis = await generateInitial(nama_terapis, 'Terapis');
  const foto_terapis = foto ? simpanFoto(foto, "terapis") : null;

  // 4. Operasi ke Database
  await terapisModel.buatTerapis({
    id_terapis,
    nama_terapis,
    no_hp_terapis,
    gender_terapis,
    foto_terapis,
    inisial_terapis,
    status_terapis: status_terapis === true || status_terapis === "true"
  });

  await terapisModel.buatAlokasiTerapis({
    id_terapis,
    id_cabang,
    waktu_berlaku: wkt_berlaku || new Date(),
    status_alokasi: true
  });

  if (keahlian_ids && Array.isArray(keahlian_ids) && keahlian_ids.length > 0) {
    for (const id_keahlian of keahlian_ids) {
      await terapisModel.tambahKeahlianTerapis({ id_terapis, id_keahlian });
    }
  }
}

/**
 * Memperbarui data terapis yang sudah ada.
 * Melakukan validasi terhadap cabang dan keahlian yang dipilih.
 * @param {object} data - Data terapis dari controller.
 * @returns {Promise<void>}
 */
async function perbaruiTerapis({ id_terapis, nama_terapis, no_hp_terapis, gender_terapis, foto, id_cabang, status_terapis, wkt_berlaku, keahlian_ids }) {
  // 1. Validasi Input Dasar
  if (!id_terapis || !nama_terapis || !no_hp_terapis || !gender_terapis || !id_cabang || typeof status_terapis === "undefined") {
    throw new Error("Semua field wajib diisi (nama, no hp, gender, cabang, status).");
  }

  // 2. Validasi Relasi (Aturan Bisnis Soft-Delete)
  if (!(await cabangModel.cekCabangAktif(id_cabang))) {
    throw new Error("Cabang yang dipilih tidak ditemukan atau tidak aktif.");
  }

  if (keahlian_ids && Array.isArray(keahlian_ids) && keahlian_ids.length > 0) {
    for (const id_keahlian of keahlian_ids) {
      if (!(await keahlianPaketModel.cekKeahlianAktif(id_keahlian))) {
        throw new Error(`Salah satu keahlian yang dipilih tidak ditemukan atau tidak aktif.`);
      }
    }
  }

  // 3. Dapatkan Data Lama untuk perbandingan
  const dataLama = await terapisModel.cariTerapis(id_terapis);
  if (!dataLama) {
    throw new Error("Terapis tidak ditemukan.");
  }

  // 4. Proses Data
  const foto_terapis = foto ? simpanFoto(foto, "terapis") : dataLama.foto_terapis;
  let inisial_terapis = dataLama.inisial_terapis;
  if (nama_terapis !== dataLama.nama_terapis) {
    inisial_terapis = await generateInitial(nama_terapis, 'Terapis');
  }

  // 5. Operasi ke Database
  await terapisModel.perbaruiTerapis({
    id_terapis,
    nama_terapis,
    no_hp_terapis,
    gender_terapis,
    foto_terapis,
    inisial_terapis,
    status_terapis: status_terapis === true || status_terapis === "true"
  });

  // Cek jika ada perubahan cabang, baru buat alokasi baru
  const cabangTerakhir = await terapisModel.cabangTerapisTerbaru(id_terapis);
  if (!cabangTerakhir || cabangTerakhir.id_cabang !== id_cabang) {
    await terapisModel.buatAlokasiTerapis({
      id_terapis,
      id_cabang,
      waktu_berlaku: wkt_berlaku || new Date(),
      status_alokasi: true
    });
  }

  // Hapus semua keahlian lama, lalu tambahkan yang baru (jika ada)
  await terapisModel.hapusKeahlianTerapis(id_terapis);
  if (keahlian_ids && Array.isArray(keahlian_ids) && keahlian_ids.length > 0) {
    for (const id_keahlian of keahlian_ids) {
      await terapisModel.tambahKeahlianTerapis({ id_terapis, id_keahlian });
    }
  }
}

module.exports = {
  daftarTerapis,
  daftarTerapisAktif,
  buatTerapis,
  perbaruiTerapis
};