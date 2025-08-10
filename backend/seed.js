const { Client } = require("pg");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// --- Konfigurasi Koneksi Database ---
// Pastikan konfigurasi ini sesuai dengan pengaturan PostgreSQL Anda
const client = new Client({
  user: "postgres",
  password: "root",
  host: "localhost",
  port: 5434,
  database: "KoTA102",
});

/**
 * Fungsi untuk menghasilkan ID unik untuk form dengan format 4 karakter.
 * @param {string} tipe - Tipe data form ('textarea', 'number', 'upload')
 * @param {number} index - Urutan form
 * @returns {string} - ID Form 4 karakter (contoh: FC01, FN04)
 */
function generateFormId(tipe, index) {
  // Tentukan prefix berdasarkan tipe data
  // 'textarea' dan 'upload' dianggap sebagai tipe char (FC)
  const prefix = (tipe === 'number') ? 'FN' : 'FC';
  
  // Buat 2 digit angka dengan padding nol di depan
  const paddedIndex = (index + 1).toString().padStart(2, '0');
  
  return `${prefix}${paddedIndex}`;
}


async function main() {
  await client.connect();
  console.log("🚀 Koneksi ke database berhasil.");

  // --- 1. CABANG ---
  console.log("\n--- Memproses Cabang ---");
  const cabangs = [
    {
      id_cabang: "01",
      nama_cabang: "Sarijadi",
      alamat_cabang: "Jl. Sarijadi Blok 24 No. 52, Sukawarna Kecamatan Sukajadi",
      status_cabang: true,
      foto_cabang: "sarijadi.png"
    },
    {
      id_cabang: "02",
      nama_cabang: "Soreang",
      alamat_cabang: "Jl. Komp. Gandasari Indah Blok C No.7, Gandasari, Katapang, Soreang",
      status_cabang: true,
      foto_cabang: "soreang.png"
    }
  ];

  for (const c of cabangs) {
    const check = await client.query(
      "SELECT 1 FROM CABANG WHERE ID_CABANG = $1",
      [c.id_cabang]
    );
    if (!check.rowCount) {
      await client.query(
        "INSERT INTO CABANG (ID_CABANG, NAMA_CABANG, ALAMAT_CABANG, STATUS_CABANG, FOTO_CABANG) VALUES ($1, $2, $3, $4, $5)",
        [c.id_cabang, c.nama_cabang, c.alamat_cabang, c.status_cabang, c.foto_cabang]
      );
      console.log(`✅ Cabang "${c.nama_cabang}" berhasil disimpan.`);
    } else {
      console.log(`⚠️  Cabang "${c.nama_cabang}" sudah ada, dilewati.`);
    }
  }

  // --- 2. ADMINISTRATIF (SUPERADMIN) ---
  console.log("\n--- Memproses Superadmin ---");
  const idAdmin = "SA01";
  const username = "superadmin";
  const password = "superadmin123";
  const nama_admin = "Muhammad Ridwan Herlambang";
  const inisial_admin = "MR";
  const foto_admin = "superadmin.png"; // siapkan file di src/assets/administratif/
  const status_admin = true;
  const nama_role = "Superadmin";

  const hashed = await bcrypt.hash(password, 10);

  const asalFoto = path.join(__dirname, "superadmin.png");
  const tujuanFoto = path.join(__dirname, "../src/assets/administratif", foto_admin);

  if (!fs.existsSync(path.dirname(tujuanFoto))) {
    fs.mkdirSync(path.dirname(tujuanFoto), { recursive: true });
  }
  if (fs.existsSync(asalFoto)) {
    fs.copyFileSync(asalFoto, tujuanFoto);
    console.log("✅ File superadmin.png berhasil disalin.");
  } else {
    console.warn("⚠️  File superadmin.png tidak ditemukan, lanjut tanpa menyalin file.");
  }

  const cekAdmin = await client.query(
    "SELECT 1 FROM ADMINISTRATIF WHERE ID_ADMINISTRATIF = $1",
    [idAdmin]
  );
  if (!cekAdmin.rowCount) {
    await client.query(
      `INSERT INTO ADMINISTRATIF
        (ID_ADMINISTRATIF, USERNAME, PASSWORD, FOTO_ADMIN, NAMA_ADMIN, INISIAL_ADMIN, NAMA_ROLE, STATUS_ADMIN)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [idAdmin, username, hashed, foto_admin, nama_admin, inisial_admin, nama_role, status_admin]
    );
    console.log(`✅ Superadmin berhasil disimpan. Username: ${username}`);
  } else {
    console.log("⚠️  Superadmin sudah ada, dilewati.");
  }

  // --- 3. ALOKASI_ADMIN ---
  console.log("\n--- Memproses Alokasi Admin ---");
  for (const c of cabangs) {
    const check = await client.query(
      "SELECT 1 FROM ALOKASI_ADMIN WHERE ID_ADMINISTRATIF = $1 AND ID_CABANG = $2",
      [idAdmin, c.id_cabang]
    );
    if (!check.rowCount) {
      await client.query(
        "INSERT INTO ALOKASI_ADMIN (ID_ADMINISTRATIF, ID_CABANG, STATUS_ALOKASI, WAKTU_BERLAKU) VALUES ($1, $2, $3, $4)",
        [idAdmin, c.id_cabang, true, new Date()]
      );
      console.log(`✅ Alokasi superadmin ke cabang ${c.nama_cabang} berhasil.`);
    } else {
      console.log(`⚠️  Alokasi superadmin ke cabang ${c.nama_cabang} sudah ada.`);
    }
  }

  // --- 4. REFERENSI_FORM ---
  console.log("\n--- Memproses Referensi Form ---");
  const formFields = {
    Bagian_Cedera: { tipe: 'textarea', satuan: '' },
    Kronologi_Cedera: { tipe: 'textarea', satuan: '' },
    Detail_Keluhan: { tipe: 'textarea', satuan: '' },
    Lama_Keluhan: { tipe: 'number', satuan: 'hari' },
    Riwayat_Penyakit: { tipe: 'textarea', satuan: '' },
    Harga_Paket: { tipe: 'number', satuan: 'Rp' },
    Biaya_Tambahan: { tipe: 'number', satuan: 'Rp' },
    Uang_Tip: { tipe: 'number', satuan: 'Rp' },
    Foto_Pasien: { tipe: 'upload', satuan: '' },
    Saran_Setelah_Treatment: { tipe: 'textarea', satuan: '' },
    Temuan_Lain: { tipe: 'textarea', satuan: '' },
    Berat_Badan: { tipe: 'number', satuan: 'kg' },
    Trivia: { tipe: 'textarea', satuan: '' },
    Alamat: { tipe: 'textarea', satuan: '' }
  };

  const fieldNames = Object.keys(formFields);
  for (let i = 0; i < fieldNames.length; i++) {
    const nama_form = fieldNames[i];
    const { tipe, satuan } = formFields[nama_form];
    const id_form = generateFormId(tipe, i);

    const check = await client.query(
      "SELECT 1 FROM REFERENSI_FORM WHERE ID_FORM = $1",
      [id_form]
    );

    if (!check.rowCount) {
      await client.query(
        "INSERT INTO REFERENSI_FORM (ID_FORM, NAMA_FORM, SATUAN, TIPE_DATA) VALUES ($1, $2, $3, $4)",
        [id_form, nama_form.replace(/_/g, ' '), satuan, tipe]
      );
      console.log(`✅ Form "${nama_form.replace(/_/g, ' ')}" [${id_form}] berhasil disimpan.`);
    } else {
      console.log(`⚠️  Form "${nama_form.replace(/_/g, ' ')}" [${id_form}] sudah ada, dilewati.`);
    }
  }

  await client.end();
}

main()
  .then(() => console.log("\n✅ Selesai seeding data."))
  .catch(e => {
    console.error("❌ Error:", e.stack);
    client.end();
  });
