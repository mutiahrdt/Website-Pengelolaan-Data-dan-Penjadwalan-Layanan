// file: backend/src/features/penjadwalan/constraints/hardconstraints.js

const dayjs = require('dayjs');
const isBetween = require('dayjs/plugin/isBetween');
const customParseFormat = require('dayjs/plugin/customParseFormat');

dayjs.extend(isBetween);
dayjs.extend(customParseFormat);

/**
 * Menghasilkan array ID sesi yang dibutuhkan berdasarkan sesi mulai dan total durasi.
 * Mengembalikan array kosong jika durasi melebihi batas harian.
 */
function generateRequiredSessions(startSessionId, totalSessions) {
    if (!startSessionId) {
        throw new Error('startSessionId tidak boleh kosong.');
    }
    const sessions = [];
    const startNum = parseInt(startSessionId.replace(/\D/g, ''), 10);
    for (let i = 0; i < totalSessions; i++) {
        const sessionNum = startNum + i;
        if (sessionNum > 12) {
            return []; // Melebihi batas jam kerja, kembalikan array kosong sebagai tanda tidak valid
        }
        sessions.push(`S${String(sessionNum).padStart(2, '0')}`);
    }
    return sessions;
}

/**
 * HARD CONSTRAINT: Memeriksa apakah terapis memiliki keahlian yang dibutuhkan.
 */
function hasRequiredSkill(terapis, requiredSkillId) {
  return terapis.keahlian_ids?.includes(requiredSkillId);
}

/**
 * HARD CONSTRAINT: Memeriksa apakah kuota kerja terapis masih mencukupi.
 */
function hasEnoughQuota(terapis, newSessionsCount, workloads) {
  const currentWorkload = workloads.get(terapis.id_terapis) || 0;
  return (terapis.kuota_jam_kerja || 0) - currentWorkload >= newSessionsCount;
}

/**
 * HARD CONSTRAINT: Memeriksa ketersediaan terapis (tidak bentrok, dalam jam sif, dan tidak terlambat).
 */
function isTherapistAvailable(terapis, requiredSessions, context) {
    const { allSesi, occupancy } = context;

    // Cek data sif
    if (!terapis.sif_mulai || !terapis.sif_selesai) return false;
    const sifMulai = dayjs(terapis.sif_mulai, "HH:mm:ss");
    const sifSelesai = dayjs(terapis.sif_selesai, "HH:mm:ss");
    if (!sifMulai.isValid() || !sifSelesai.isValid()) return false;

    // Dapatkan detail blok sesi yang diminta
    const detailSesiPertama = allSesi.find(s => s.id_sesi === requiredSessions[0]);
    const detailSesiTerakhir = allSesi.find(s => s.id_sesi === requiredSessions[requiredSessions.length - 1]);
    if (!detailSesiPertama || !detailSesiTerakhir) return false;

    const blokMulai = dayjs(detailSesiPertama.jam_mulai, "HH:mm:ss");
    const blokSelesai = dayjs(detailSesiTerakhir.jam_selesai, "HH:mm:ss");

    // Cek apakah blok sesi berada di dalam jam sif
    if (blokMulai.isBefore(sifMulai) || blokSelesai.isAfter(sifSelesai)) {
        return false;
    }

    // Cek keterlambatan (jika ada data kehadiran)
    if (terapis.waktu_kehadiran_aktual) {
        const waktuHadir = dayjs(terapis.waktu_kehadiran_aktual, "HH:mm:ss");
        if (blokMulai.isBefore(waktuHadir)) {
            return false;
        }
    }

    // Cek konflik jadwal (okupansi) untuk setiap sesi di dalam blok
    for (const sessionId of requiredSessions) {
      if (occupancy.terapis[sessionId]?.has(terapis.id_terapis)) {
        return false;
      }
    }

    return true; // Lolos semua pengecekan
}

/**
 * HARD CONSTRAINT: Memeriksa apakah ruangan tidak sedang digunakan.
 * Fungsi ini HANYA memeriksa okupansi, tidak peduli tipe ruangannya.
 */
function isRoomAvailable(ruangan, requiredSessions, context) {
  const { occupancy } = context;
  for (const sessionId of requiredSessions) {
    if (occupancy.ruangan[sessionId]?.has(ruangan.id_ruangan)) {
      return false; // Ruangan terpakai
    }
  }
  return true;
}

/**
 * HARD CONSTRAINT: Memeriksa apakah tipe ruangan cocok dengan preferensi.
 * Fungsi ini HANYA memeriksa kecocokan tipe (Onsite vs Homecare).
 */
function isRoomTypeCorrect(ruangan, roomTypePreference) {
    const isHomecareRoom = ruangan.nama_ruangan.toLowerCase().includes('homecare');
    if (roomTypePreference === 'Homecare') {
        return isHomecareRoom;
    }
    if (roomTypePreference === 'Onsite') {
        return !isHomecareRoom;
    }
    return false; // Jika preferensinya bukan 'Onsite' atau 'Homecare', anggap tidak valid.
}

module.exports = {
  generateRequiredSessions,
  hasRequiredSkill,
  hasEnoughQuota,
  isTherapistAvailable,
  isRoomAvailable,
  isRoomTypeCorrect,
};