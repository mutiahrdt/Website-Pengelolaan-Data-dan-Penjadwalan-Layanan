// file: backend/jamKerja/jamKerjaService.js (FINAL)

const jamKerjaModel = require("./jamKerjaModel");
const kehadiranModel = require("../kehadiran/kehadiranModel"); // Pastikan path ini benar

/**
 * Fungsi utilitas untuk mendapatkan semua tanggal untuk hari tertentu dalam triwulan.
 */
function getDatesForDayInQuarter(year, quarter, dayOfWeek) {
    const dayMap = { 'senin': 1, 'selasa': 2, 'rabu': 3, 'kamis': 4, 'jumat': 5, 'sabtu': 6, 'minggu': 0 };
    const targetDay = dayMap[dayOfWeek.toLowerCase()];
    if (targetDay === undefined) return [];

    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);
    const endDate = new Date(year, startMonth + 3, 0);
    
    const dates = [];
    let currentDate = new Date(startDate);
    // Loop untuk menemukan hari pertama yang benar
    while (currentDate.getDay() !== targetDay) {
        currentDate.setDate(currentDate.getDate() + 1);
        if (currentDate > endDate) break;
    }
    
    // Setelah ditemukan, tambahkan 7 hari untuk setiap iterasi
    while (currentDate <= endDate) {
        dates.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7);
    }
    return dates;
}

/**
 * Membuat entri Jam Kerja baru dan men-generate semua record Kehadiran yang relevan.
 */
async function buat(data) {
  const { id_terapis, id_sif, hari_kerja, triwulan } = data;

  // 1. Buat entri Jam Kerja terlebih dahulu untuk memenuhi constraint FK
  const jamKerjaBaru = await jamKerjaModel.buat(data);

  // 2. Generate semua tanggal yang relevan berdasarkan triwulan dan hari kerja
  const [year, quarter] = triwulan.split('Q');
  const daftarTanggal = getDatesForDayInQuarter(parseInt(year), parseInt(quarter), hari_kerja);
  
  // 3. Buat entri Kehadiran untuk setiap tanggal yang dihasilkan
  //    Kita gunakan Promise.all untuk menjalankan semua insert secara paralel agar lebih cepat.
  const promisesKehadiran = daftarTanggal.map(tanggal => {
    const dataKehadiran = {
      tanggal_kehadiran: tanggal, // PK: hanya tanggal
      id_terapis,                 // PK
      id_sif,                     // FK ke JamKerja
      hari_kerja,                 // FK ke JamKerja
      triwulan,                   // FK ke JamKerja
      status_kehadiran: true,    // Default status
      waktu_kehadiran: null,      // Awalnya NULL, diisi saat presensi
      keterangan_kehadiran: null,
    };
    // Menggunakan fungsi 'buat' dari kehadiranModel
    return kehadiranModel.buat(dataKehadiran); 
  });

  await Promise.all(promisesKehadiran);
  return jamKerjaBaru;
}

/**
 * Memperbarui Jam Kerja.
 * Menerima objek yang berisi 'keys' untuk identifikasi dan 'values' untuk data baru.
 */
async function perbarui(data) {
    const { keys, values } = data;
    if (!keys || !values) {
        throw new Error("Format data untuk pembaruan tidak valid. Harus berisi 'keys' dan 'values'.");
    }
    
    // Catatan: Jika suatu saat Anda ingin mengizinkan perubahan hari/sif/triwulan,
    // logika untuk menghapus kehadiran lama dan membuat yang baru harus ditambahkan di sini.
    // Untuk saat ini, kita hanya meneruskan ke model.
    return await jamKerjaModel.perbarui(keys, values);
}

/**
 * Mengambil semua data jam kerja.
 */
async function dapatkanSemua() { 
  return await jamKerjaModel.dapatkanSemua(); 
}

module.exports = { buat, perbarui, dapatkanSemua };