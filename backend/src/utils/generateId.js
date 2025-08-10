// file: backend/utils/generateId.js (LENGKAP & DIPERBAIKI)

const pool = require("./db");

// Generate ID Cabang: '01', '02', dst
async function generateIdCabang() {
  const res = await pool.query("SELECT MAX(CAST(id_cabang AS INTEGER)) AS maxnum FROM cabang");
  let nextNum = (res.rows[0].maxnum || 0) + 1;
  if (nextNum > 99) throw new Error("ID Cabang 01–99 habis.");
  return String(nextNum).padStart(2, "0");
}

// Generate ID Ruangan: '0101', '0102' dst (id_cabang + 2 digit increment)
async function generateIdRuangan(id_cabang) {
  const res = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(id_ruangan, 3, 2) AS INTEGER)) AS maxnum FROM ruangan WHERE id_cabang = $1",
    [id_cabang]
  );
  let nextNum = (res.rows[0].maxnum || 0) + 1;
  if (nextNum > 99) throw new Error(`ID Ruangan di cabang ${id_cabang} sudah habis.`);
  const suffix = String(nextNum).padStart(2, "0");
  return id_cabang + suffix;
}

// Generate ID Administratif: SA/AD + 2 digit increment
async function generateIdAdministratif(role) {
  const rolePrefix = role === "Superadmin" ? "SA" : "AD";
  const res = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(id_administratif, 3, 2) AS INTEGER)) AS maxnum FROM administratif WHERE id_administratif LIKE $1",
    [`${rolePrefix}%`]
  );
  const nextNum = (res.rows[0].maxnum || 0) + 1;
  return rolePrefix + String(nextNum).padStart(2, "0");
}

// Generate ID Terapis: T + 2 digit increment
async function generateIdTerapis() {
  const res = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(id_terapis, 2, 2) AS INTEGER)) AS maxnum FROM terapis"
  );
  const nextNum = (res.rows[0].maxnum || 0) + 1;
  return "T" + String(nextNum).padStart(2, "0");
}

// Generate ID Keahlian: K + 2 digit increment
async function generateIdKeahlian() {
  const res = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(id_keahlian, 2, 2) AS INTEGER)) AS maxnum FROM keahlian"
  );
  const nextNum = (res.rows[0].maxnum || 0) + 1;
  return "K" + String(nextNum).padStart(2, "0");
}

// id_paket: 3 digit id_keahlian + 2 digit increment (01, 02, ...)
async function generateIdPaket(id_keahlian) {
  const res = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(id_paket, 4, 2) AS INTEGER)) AS maxnum FROM paket WHERE id_keahlian = $1",
    [id_keahlian]
  );
  let nextNum = (res.rows[0].maxnum || 0) + 1;
  if (nextNum > 99) throw new Error("Increment Paket habis untuk keahlian ini");
  const suffix = String(nextNum).padStart(2, "0");
  return id_keahlian + suffix; // hasil: K0101, K0102, K0201
}

// Generate ID Sesi: S + 2 digit increment
async function generateIdSesi() {
  const res = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(id_sesi, 2, 2) AS INTEGER)) as maxnum FROM sesi"
  );
  let next = (res.rows[0].maxnum || 0) + 1;
  if (next > 99) throw new Error("ID sesi habis");
  return "S" + String(next).padStart(2, "0");
}

// Generate ID Pasien: 8 digit tanggal (YYYYMMDD) + 2 digit increment
async function generateIdPasien() {
  const d = new Date();
  const prefix =
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const res = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(id_pasien, 9, 2) AS INTEGER)) AS maxnum FROM pasien WHERE id_pasien LIKE $1",
    [prefix + "%"]
  );
  const nextNum = (res.rows[0].maxnum || 0) + 1;
  return prefix + String(nextNum).padStart(2, "0");
}

// Generate ID Form: FC/FN + 5 digit numeric
async function generateIdForm(prefix = "FN") {
  const res = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(id_form, 3, 5) AS INTEGER)) AS maxnum FROM referensi_form WHERE id_form LIKE $1",
    [prefix + "%"]
  );
  const nextNum = (res.rows[0].maxnum || 0) + 1;
  return prefix + String(nextNum).padStart(5, "0");
}

// Generate ID Pemesanan: 2 digit id_cabang + 6 digit tanggal jadwal (YYYYMMDD) + 2 digit increment
async function generateIdPemesanan(id_cabang, tanggal) {
  // tanggal dalam format YYYYMMDD
  const prefix = id_cabang + tanggal;
  const res = await pool.query(
    "SELECT MAX(CAST(SUBSTRING(id_pesanan, 9, 2) AS INTEGER)) AS maxnum FROM pesanan WHERE id_pesanan LIKE $1",
    [prefix + "%"]
  );
  const nextNum = (res.rows[0].maxnum || 0) + 1;
  return prefix + String(nextNum).padStart(2, "0");
}

// Generate ID Kehadiran: 3 id terapis + DDMMYY, contoh: T01010125
function generateIdKehadiran(id_terapis, tanggalObj) {
  if (!id_terapis || !tanggalObj) {
    throw new Error("ID Terapis dan objek tanggal diperlukan.");
  }
  const dd = String(tanggalObj.getDate()).padStart(2, '0');
  const mm = String(tanggalObj.getMonth() + 1).padStart(2, '0');
  const yy = String(tanggalObj.getFullYear()).slice(-2);
  
  return `${id_terapis}${dd}${mm}${yy}`;
}

/**
 * PERBAIKAN UTAMA: Generate ID Sif (char(1))
 * Fungsi ini akan mencari karakter unik pertama dari nama sif.
 * Contoh: "Siang" -> "S". Jika "S" sudah ada, "Sore" -> "O".
 */
async function generateIdSif(nama_sif) {
  // 1. Validasi input, pastikan tidak kosong
  const namaSifStr = String(nama_sif).trim();
  if (namaSifStr.length === 0) {
    throw new Error("Nama Sif tidak boleh kosong.");
  }

  // 2. Ambil semua ID Sif yang sudah ada dari database
  const { rows } = await pool.query("SELECT id_sif FROM sif");
  // Buat Set untuk pencarian yang cepat dan case-insensitive
  const usedIds = new Set(rows.map(row => row.id_sif.toUpperCase()));

  // 3. Ubah nama sif menjadi array karakter kandidat
  const kandidatId = namaSifStr.toUpperCase().split('');

  // 4. Loop melalui setiap karakter untuk menemukan yang belum digunakan
  for (const char of kandidatId) {
    if (!usedIds.has(char)) {
      // Ditemukan ID unik, kembalikan.
      return char;
    }
  }

  // 5. Jika tidak ada karakter yang tersedia, lempar error
  throw new Error(
    `Tidak dapat membuat ID unik untuk sif '${namaSifStr}'. Semua karakter ('${kandidatId.join(
      ", "
    )}') telah digunakan.`
  );
}

module.exports = {
  generateIdCabang,
  generateIdRuangan,
  generateIdAdministratif,
  generateIdTerapis,
  generateIdKeahlian,
  generateIdPaket,
  generateIdSesi,
  generateIdPasien,
  generateIdForm,
  generateIdPemesanan,
  generateIdKehadiran,
  generateIdSif, // Pastikan fungsi yang benar diekspor
};