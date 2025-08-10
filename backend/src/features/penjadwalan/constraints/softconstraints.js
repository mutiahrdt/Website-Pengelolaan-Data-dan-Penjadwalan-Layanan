// file: backend/src/features/penjadwalan/constraints/softconstraints.js

const { Logger } = require('../utils/logger');
const logger = Logger('SoftConstraints');

// Bobot penalti yang bisa disesuaikan
const PENALTY_WEIGHTS = {
  TIME_SHIFT: 1000,
  THERAPIST_NAME_MISMATCH: 500,
  GENDER_MISMATCH: 200,
  LOAD_BALANCING_FACTOR: 50,
};

/**
 * Mengevaluasi sebuah solusi lengkap { sesi, terapis, ruangan } dan menghitung penaltinya.
 * @param {object} solution - Solusi yang ditemukan oleh solver, berisi { sesi, terapis, ruangan }.
 * @param {object} context - Konteks data penjadwalan.
 * @returns {object} - Solusi yang diperkaya dengan total penalti dan detail pelanggaran.
 */
function evaluateSolution(solution, context) {
  const { terapis, ruangan, sesi } = solution;
  const { inputPenjadwalan, workloads } = context;

  // [PERBAIKAN UTAMA] Memberikan nilai default objek kosong jika `preferensi` tidak ada.
  // Ini mencegah error dan memastikan logika berjalan dengan aman.
  const preferensi = inputPenjadwalan?.preferensi || {};
  
  let totalPenalty = 0;
  const violations = [];

  // 1. Soft Constraint: Pergeseran Waktu Sesi
  // Diberi penalti jika sesi yang ditemukan berbeda dari yang diminta user.
  if (sesi !== inputPenjadwalan.sesi_mulai) {
    totalPenalty += PENALTY_WEIGHTS.TIME_SHIFT;
    violations.push({
      type: 'TIME_SHIFT_PREFERENCE',
      message: `Sesi bergeser dari ${inputPenjadwalan.sesi_mulai} ke ${sesi} karena slot awal tidak tersedia.`
    });
  }

  // 2. Soft Constraint: Preferensi Nama Terapis
  if (preferensi.nama_terapis && terapis.nama_terapis !== preferensi.nama_terapis) {
    totalPenalty += PENALTY_WEIGHTS.THERAPIST_NAME_MISMATCH;
    violations.push({
      type: 'THERAPIST_NAME_PREFERENCE',
      message: `Terapis yang dipilih (${terapis.nama_terapis}) tidak sesuai dengan preferensi (${preferensi.nama_terapis}).`
    });
  }

  // 3. Soft Constraint: Preferensi Gender Terapis
  // Pengecekan ini sekarang aman karena `preferensi` dijamin berupa objek.
  if (preferensi.jenis_kelamin && terapis.gender_terapis !== preferensi.jenis_kelamin) {
    totalPenalty += PENALTY_WEIGHTS.GENDER_MISMATCH;
    const genderPrefText = preferensi.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan';
    violations.push({
      type: 'GENDER_PREFERENCE',
      message: `Terapis yang dipilih (${terapis.nama_terapis}) tidak sesuai dengan preferensi gender (${genderPrefText}).`
    });
  }

  // 4. Soft Constraint: Pemerataan Beban Kerja (Load Balancing)
  const currentWorkload = workloads.get(terapis.id_terapis) || 0;
  const maxWorkload = terapis.kuota_jam_kerja || 8; // Anggap 8 jika kuota tidak di-set
  if (maxWorkload > 0) {
      const workloadRatio = currentWorkload / maxWorkload;
      totalPenalty += (workloadRatio * PENALTY_WEIGHTS.LOAD_BALANCING_FACTOR);
  }

  // Mengembalikan objek lengkap untuk diurutkan
  return {
    ...solution, // Mengandung { sesi, terapis, ruangan }
    totalPenalty,
    violations,
    // Solusi dianggap sempurna HANYA jika total penaltinya persis 0
    isPerfect: totalPenalty === 0,
  };
}

module.exports = {
  evaluateSolution,
};