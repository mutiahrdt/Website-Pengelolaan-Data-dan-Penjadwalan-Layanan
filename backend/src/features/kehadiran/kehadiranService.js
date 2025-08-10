// file: backend/src/features/kehadiran/kehadiranService.js

const kehadiranModel = require("./kehadiranModel");
const sifModel = require("../sif/sifModel");
const sesiModel = require("../sesi/sesiModel");
const dayjs = require("dayjs");
const penjadwalanModel = require("../penjadwalan/penjadwalanModel");
const { buatJadwalDenganCSP } = require("../penjadwalan/penjadwalanService"); // Hanya butuh fungsi ini

const { Logger } = require('../penjadwalan/utils/logger');
const logger = Logger('KehadiranService');

async function daftarKehadiran(tanggal) {
  if (!tanggal) throw new Error("Tanggal wajib diisi.");
  return await kehadiranModel.daftarBerdasarkanTanggal(tanggal);
}

async function catatKehadiran(data) {
  const { tanggal_kehadiran, id_terapis, id_sif, status_kehadiran, keterangan_manual, waktu_manual } = data;
  if (!tanggal_kehadiran || !id_terapis || !id_sif) {
    throw new Error("Tanggal, ID Terapis, dan ID Sif wajib diisi.");
  }

  // --- Penentuan status & waktu (tidak berubah) ---
  let keterangan_final = keterangan_manual;
  let waktu_kehadiran_final = null;
  if (status_kehadiran === true) {
    if (!waktu_manual) throw new Error("Waktu kehadiran wajib diisi jika status Hadir.");
    waktu_kehadiran_final = dayjs(tanggal_kehadiran).format('YYYY-MM-DD') + ' ' + waktu_manual;
    const sif = await sifModel.getById(id_sif);
    if (!sif) throw new Error(`Sif dengan ID ${id_sif} tidak ditemukan.`);
    const jadwalMasuk = dayjs(tanggal_kehadiran).hour(sif.jam_mulai.split(':')[0]).minute(sif.jam_mulai.split(':')[1]);
    const aktualMasuk = dayjs(waktu_kehadiran_final);
    keterangan_final = aktualMasuk.isAfter(jadwalMasuk) ? 'Terlambat' : 'Tepat Waktu';
  } else {
    keterangan_final = keterangan_final || 'Tidak Hadir'; // Default jika kosong
  }
  
  const dataUntukUpdate = {
    tanggal_kehadiran, id_terapis, status_kehadiran,
    waktu_kehadiran: waktu_kehadiran_final,
    keterangan_kehadiran: keterangan_final,
  };

  const kehadiranDiperbarui = await kehadiranModel.perbarui(dataUntukUpdate);
  if (!kehadiranDiperbarui) {
      throw new Error("Gagal memperbarui kehadiran, data tidak ditemukan.");
  }

  // --- LOGIKA PEMBATALAN DAN RESCHEDULE OTOMATIS ---
  const jadwalAlternatif = [];
  const pesananTerdampak = await penjadwalanModel.getActiveBookingsByTherapist(id_terapis, tanggal_kehadiran);

  if (pesananTerdampak.length > 0) {
    const waktuHadirObj = status_kehadiran ? dayjs(waktu_kehadiran_final) : null;
    const semuaSesi = await sesiModel.daftarSesi();

    for (const pesanan of pesananTerdampak) {
      const detailPesanan = await penjadwalanModel.getPesananDanJadwal(pesanan.id_pesanan);
      if (!detailPesanan || !detailPesanan.jadwal_lama || detailPesanan.jadwal_lama.length === 0) continue;

      const sesiMulaiId = detailPesanan.jadwal_lama[0].id_sesi;
      const detailSesiMulai = semuaSesi.find(s => s.id_sesi === sesiMulaiId);
      if (!detailSesiMulai) continue;
      
      const waktuMulaiSesi = dayjs(`${tanggal_kehadiran} ${detailSesiMulai.jam_mulai}`);
      
      // Tentukan apakah jadwal ini harus dibatalkan
      const harusBatal = 
        (status_kehadiran === false) || // Terapis tidak hadir
        (status_kehadiran === true && waktuHadirObj && waktuHadirObj.isAfter(waktuMulaiSesi)); // Terapis hadir tapi terlambat melewati jam mulai sesi

      if (harusBatal) {
        logger.info(`Pesanan ${pesanan.id_pesanan} terdampak oleh ketidakhadiran/keterlambatan terapis ${id_terapis}.`);
        
        // Batalkan jadwal lama dengan status 'Dibatalkan MR'
        await penjadwalanModel.cancelBooking(pesanan.id_pesanan, 'Dibatalkan MR');

        // [LOGIKA CERDAS] Siapkan input untuk pencarian ulang
        const inputUntukReschedule = {
            id_pasien: detailPesanan.id_pasien,
            id_paket: detailPesanan.id_paket,
            tanggal: tanggal_kehadiran,
            jenis_ruangan: detailPesanan.jenis_ruangan,
            waktu_tempuh: detailPesanan.waktu_tempuh,
            preferensi: {
                nama_terapis: null, // Kosongkan preferensi agar bisa mencari terapis lain
                jenis_kelamin: null,
            },
            id_admin: detailPesanan.id_administratif,
            cabangId: detailPesanan.id_cabang,
            // Sesi mulai default adalah sesi asli, biarkan solver yang mencari alternatif
            sesi_mulai: sesiMulaiId,
        };
        
        logger.info(`Mencari jadwal ulang untuk pesanan ${pesanan.id_pesanan}...`, { input: inputUntukReschedule });
        // Panggil service penjadwalan untuk mencari solusi baru
        const hasilPencarianUlang = await buatJadwalDenganCSP(inputUntukReschedule);

        jadwalAlternatif.push({
          id_pesanan_terdampak: pesanan.id_pesanan,
          nama_pasien: detailPesanan.nama_pasien, // Tambahkan nama pasien untuk UI
          hasil_pencarian_ulang: {
            ...hasilPencarianUlang,
            originalInput: inputUntukReschedule // Kirim input asli untuk konfirmasi
          },
        });
      }
    }
  }

  return {
    kehadiran: kehadiranDiperbarui,
    jadwalAlternatif,
  };
}

module.exports = { daftarKehadiran, catatKehadiran };