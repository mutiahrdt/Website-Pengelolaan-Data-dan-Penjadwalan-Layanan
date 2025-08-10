// File: backend/keahlian/keahlianPaketService.js (REVISI LENGKAP)

const model = require("./keahlianPaketModel");
const { simpanFoto } = require("../../utils/uploadFoto");
const { generateIdKeahlian, generateIdPaket } = require("../../utils/generateId");

async function daftarKeahlianPaket() {
  return await model.daftarKeahlianPaket();
}

async function buatKeahlian({ nama_keahlian, status_keahlian }) {
  if (!nama_keahlian) throw new Error("Nama keahlian wajib diisi");
  const id_keahlian = await generateIdKeahlian();
  await model.buatKeahlian({ id_keahlian, nama_keahlian, status_keahlian: !!status_keahlian });
}

async function perbaruiKeahlian({ id_keahlian, nama_keahlian, status_keahlian }) {
  if (!nama_keahlian) throw new Error("Nama keahlian wajib diisi");

  // Update keahlian itu sendiri
  await model.perbaruiKeahlian({ 
    id_keahlian, 
    nama_keahlian, 
    status_keahlian: !!status_keahlian 
  });

  // --- LOGIKA BARU: Cascading Deactivation ---
  // Jika keahlian dinonaktifkan, nonaktifkan juga semua paket di bawahnya.
  if (status_keahlian === false || status_keahlian === 'false') {
    await model.nonaktifkanPaketByKeahlian(id_keahlian);
  }
  // Catatan: Jika keahlian diaktifkan kembali, paket-paketnya tidak otomatis aktif.
  // Ini adalah desain yang aman untuk mencegah aktivasi massal yang tidak disengaja.
  // Paket harus diaktifkan kembali satu per satu secara manual.
}

// --- FUNGSI BUAT PAKET DIPERBAIKI ---
async function buatPaket({ id_keahlian, nama_paket, deskripsi_paket, kata_kunci, durasi_paket, status_paket, file }) {
  if (!id_keahlian || !nama_paket || !durasi_paket) throw new Error("Field utama (keahlian, nama, durasi) wajib diisi");
  if (!file) throw new Error("Gambar paket wajib diunggah");

  // --- VALIDASI BARU ---
  if (!(await model.cekKeahlianAktif(id_keahlian))) {
    throw new Error("Keahlian yang dipilih tidak ditemukan atau tidak aktif.");
  }

  const id_paket = await generateIdPaket(id_keahlian);
  const fileName = simpanFoto(file, "paket");
  
  await model.buatPaket({
    id_paket,
    id_keahlian,
    nama_paket,
    // Gunakan '|| null' untuk mengubah undefined/string kosong menjadi null
    deskripsi_paket: deskripsi_paket || null,
    kata_kunci: kata_kunci || null,
    gambar_paket: fileName,
    durasi_paket,
    status_paket: !!status_paket
  });
}

// --- FUNGSI PERBARUI PAKET DIPERBAIKI ---
async function perbaruiPaket({
  id_paket, nama_paket, deskripsi_paket, kata_kunci, gambar_paket, durasi_paket, status_paket, file
}) {
  let fileNameToSave = gambar_paket;

  if (file) {
    fileNameToSave = simpanFoto(file, "paket");
  } else if (!gambar_paket) {
    const paketLama = await model.getPaketById(id_paket);
    fileNameToSave = paketLama?.gambar_paket;
  }

  if (!fileNameToSave) throw new Error("Gambar paket wajib ada");

  await model.perbaruiPaket({
    id_paket,
    nama_paket,
    // Gunakan '|| null' untuk mengubah undefined/string kosong menjadi null
    deskripsi_paket: deskripsi_paket || null,
    kata_kunci: kata_kunci || null,
    gambar_paket: fileNameToSave,
    durasi_paket,
    status_paket: !!status_paket
  });
}

async function daftarPaket() {
  return await model.daftarPaket();
}

async function getPaketById(id_paket) {
  return await model.getPaketById(id_paket);
}

async function daftarKeahlianAktif() {
  return await model.daftarKeahlianAktif();
}
async function daftarPaketAktif() {
  return await model.daftarPaketAktif();
}

module.exports = {
  daftarKeahlianPaket,
  buatKeahlian,
  perbaruiKeahlian,
  buatPaket,
  perbaruiPaket,
  daftarPaket,
  getPaketById,
  daftarKeahlianAktif,
  daftarPaketAktif
};