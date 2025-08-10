// file: utils/generateInitial.js (DIPERBAIKI TOTAL)

const pool = require("./db");

/**
 * Membuat inisial unik (2 karakter) berdasarkan nama.
 * Jauh lebih efisien karena hanya melakukan satu query database di awal.
 *
 * @param {string} nama Nama lengkap pengguna.
 * @param {'Administratif' | 'Terapis'} entity Jenis entitas untuk menentukan tabel.
 * @returns {Promise<string>} Inisial unik yang berhasil dibuat.
 * @throws {Error} Jika semua kombinasi wajar sudah digunakan.
 */
async function generateInitial(nama, entity) {
  // 1. Ambil SEMUA inisial yang ada dalam SATU KALI QUERY.
  const query = entity === "Administratif"
      ? "SELECT INISIAL_ADMIN AS inisial FROM ADMINISTRATIF"
      : "SELECT INISIAL_TERAPIS AS inisial FROM TERAPIS";
  
  const { rows } = await pool.query(query);
  // Gunakan Set untuk pencarian yang sangat cepat (O(1) lookup)
  const existingInitials = new Set(rows.map(row => row.inisial));

  const kata = nama.trim().split(/\s+/);
  const namaLengkap = kata.join("").toUpperCase();

  // Helper untuk mengecek apakah inisial sudah ada (tanpa query DB)
  const isTaken = (initial) => existingInitials.has(initial);

  // --- LOGIKA PENCARIAN KANDIDAT (SEKARANG TANPA QUERY) ---

  // CASE: Lebih dari 1 kata (lebih prioritas)
  if (kata.length > 1) {
    const w1 = kata[0].toUpperCase();
    const w2 = kata[1].toUpperCase();

    // Prioritas 1: Huruf pertama kata pertama + huruf pertama kata kedua
    let kandidat = w1[0] + w2[0];
    if (!isTaken(kandidat)) return kandidat;

    // Prioritas 2: Kombinasi w1[0] + w2[j]
    for (let j = 1; j < w2.length; j++) {
      kandidat = w1[0] + w2[j];
      if (!isTaken(kandidat)) return kandidat;
    }
  }

  // CASE: 1 kata / fallback dari 2 kata
  // Prioritas 3: Dua huruf pertama dari nama
  if (namaLengkap.length >= 2) {
    let kandidat = namaLengkap.substring(0, 2);
    if (!isTaken(kandidat)) return kandidat;
  }
  
  // Prioritas 4: Huruf pertama dan huruf ke-i
  for (let i = 2; i < namaLengkap.length; i++) {
    let kandidat = namaLengkap[0] + namaLengkap[i];
    if (!isTaken(kandidat)) return kandidat;
  }

  // Jika masih gagal, fallback ke nomor urut dengan awalan huruf pertama
  const prefix = namaLengkap[0];
  for (let i = 1; i <= 9; i++) {
    let kandidat = prefix + i;
    if (!isTaken(kandidat)) return kandidat;
  }

  throw new Error(`Tidak dapat membuat inisial unik untuk "${nama}".`);
}

module.exports = generateInitial;