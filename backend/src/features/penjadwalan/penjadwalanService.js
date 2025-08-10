// file: backend/src/features/penjadwalan/penjadwalanService.js

const penjadwalanModel = require('./penjadwalanModel');
const softConstraints = require('./constraints/softconstraints');
const hardConstraints = require('./constraints/hardconstraints');
const { solve } = require('./algorithms/cspsolver'); // Import CSP backtracking solver
const sesiModel = require('../sesi/sesiModel');
const { Logger } = require('./utils/logger');

const logger = Logger('PenjadwalanService');

const CONFIG = {
  SESI_DURATION_MENIT: 60,
};

function hitungDurasiSesi(durasiPaketMenit, roomType, waktu_tempuh) {
  let durasiTravelTotalMenit = 0;
  if (roomType === 'Homecare' && waktu_tempuh) {
    durasiTravelTotalMenit = (parseInt(waktu_tempuh, 10) || 0) * 2;
  }
  const durasiTotalMenit = (parseInt(durasiPaketMenit, 10) || 0) + durasiTravelTotalMenit;
  return {
    jumlahSesiTotal: Math.ceil(durasiTotalMenit / CONFIG.SESI_DURATION_MENIT) || 1
  };
}

/**
 * Membuat domain dinamis untuk CSP berdasarkan konteks penjadwalan
 */
function createCSPDomain(context) {
  const { inputPenjadwalan, allAvailableTerapis, allAvailableRooms, allSesi, jumlahSesiTotal } = context;
  
  return {
    // Domain sesi: prioritaskan sesi yang diminta, fallback ke semua sesi valid
    sesi: (assignment) => {
      const preferredSesi = inputPenjadwalan.sesi_mulai;
      const allValidSesi = [];
      
      // Tambahkan sesi yang diminta terlebih dahulu
      if (preferredSesi) {
        const requiredSessions = hardConstraints.generateRequiredSessions(preferredSesi, jumlahSesiTotal);
        if (requiredSessions.length > 0) {
          allValidSesi.push(preferredSesi);
        }
      }
      
      // Tambahkan semua sesi lain yang valid sebagai alternatif
      for (const sesi of allSesi) {
        if (sesi.id_sesi !== preferredSesi) {
          const requiredSessions = hardConstraints.generateRequiredSessions(sesi.id_sesi, jumlahSesiTotal);
          if (requiredSessions.length > 0) {
            allValidSesi.push(sesi.id_sesi);
          }
        }
      }
      
      return allValidSesi;
    },
    
    // Domain terapis: filter berdasarkan keahlian dan preferensi
    terapis: (assignment) => {
      let availableTerapis = [...allAvailableTerapis];
      
      // Filter berdasarkan keahlian yang dibutuhkan
      availableTerapis = availableTerapis.filter(terapis => 
        hardConstraints.hasRequiredSkill(terapis, context.paketDetails.id_keahlian)
      );
      
      // Prioritaskan terapis berdasarkan preferensi nama
      if (inputPenjadwalan.preferensi?.nama_terapis) {
        const preferredTerapis = availableTerapis.filter(t => 
          t.nama_terapis === inputPenjadwalan.preferensi.nama_terapis
        );
        const otherTerapis = availableTerapis.filter(t => 
          t.nama_terapis !== inputPenjadwalan.preferensi.nama_terapis
        );
        availableTerapis = [...preferredTerapis, ...otherTerapis];
      }
      
      // Prioritaskan terapis berdasarkan preferensi gender
      if (inputPenjadwalan.preferensi?.jenis_kelamin) {
        const preferredGenderTerapis = availableTerapis.filter(t => 
          t.gender_terapis === inputPenjadwalan.preferensi.jenis_kelamin
        );
        const otherTerapis = availableTerapis.filter(t => 
          t.gender_terapis !== inputPenjadwalan.preferensi.jenis_kelamin
        );
        availableTerapis = [...preferredGenderTerapis, ...otherTerapis];
      }
      
      return availableTerapis;
    },
    
    // Domain ruangan: filter berdasarkan tipe ruangan
    ruangan: (assignment) => {
      return allAvailableRooms.filter(ruangan => 
        hardConstraints.isRoomTypeCorrect(ruangan, inputPenjadwalan.jenis_ruangan)
      );
    }
  };
}

/**
 * Fungsi untuk memvalidasi assignment lengkap menggunakan hard constraints
 */
function isConsistent(variable, value, assignment, context) {
  const { jumlahSesiTotal, workloads } = context;
  
  // Buat assignment sementara untuk validasi
  const tempAssignment = { ...assignment, [variable]: value };
  
  // Jika semua variabel sudah di-assign, lakukan validasi lengkap
  if (tempAssignment.sesi && tempAssignment.terapis && tempAssignment.ruangan) {
    const requiredSessions = hardConstraints.generateRequiredSessions(tempAssignment.sesi, jumlahSesiTotal);
    
    // Validasi terapis
    if (!hardConstraints.hasRequiredSkill(tempAssignment.terapis, context.paketDetails.id_keahlian)) {
      return false;
    }
    if (!hardConstraints.hasEnoughQuota(tempAssignment.terapis, jumlahSesiTotal, workloads)) {
      return false;
    }
    if (!hardConstraints.isTherapistAvailable(tempAssignment.terapis, requiredSessions, context)) {
      return false;
    }
    
    // Validasi ruangan
    if (!hardConstraints.isRoomTypeCorrect(tempAssignment.ruangan, context.inputPenjadwalan.jenis_ruangan)) {
      return false;
    }
    if (!hardConstraints.isRoomAvailable(tempAssignment.ruangan, requiredSessions, context)) {
      return false;
    }
    
    return true;
  }
  
  // Validasi parsial berdasarkan variabel yang sedang di-assign
  switch (variable) {
    case 'sesi':
      const sessions = hardConstraints.generateRequiredSessions(value, jumlahSesiTotal);
      return sessions.length > 0; // Pastikan sesi valid
      
    case 'terapis':
      if (!hardConstraints.hasRequiredSkill(value, context.paketDetails.id_keahlian)) {
        return false;
      }
      if (!hardConstraints.hasEnoughQuota(value, jumlahSesiTotal, workloads)) {
        return false;
      }
      // Jika sesi sudah di-assign, cek ketersediaan terapis
      if (tempAssignment.sesi) {
        const requiredSessions = hardConstraints.generateRequiredSessions(tempAssignment.sesi, jumlahSesiTotal);
        if (!hardConstraints.isTherapistAvailable(value, requiredSessions, context)) {
          return false;
        }
      }
      return true;
      
    case 'ruangan':
      if (!hardConstraints.isRoomTypeCorrect(value, context.inputPenjadwalan.jenis_ruangan)) {
        return false;
      }
      // Jika sesi sudah di-assign, cek ketersediaan ruangan
      if (tempAssignment.sesi) {
        const requiredSessions = hardConstraints.generateRequiredSessions(tempAssignment.sesi, jumlahSesiTotal);
        if (!hardConstraints.isRoomAvailable(value, requiredSessions, context)) {
          return false;
        }
      }
      return true;
      
    default:
      return true;
  }
}

/**
 * Mengevaluasi dan mengurutkan solusi berdasarkan soft constraints
 */
function evaluateAndRankSolutions(solutions, context) {
  logger.info(`Mengevaluasi ${solutions.length} solusi dengan soft constraints...`);
  
  const evaluatedSolutions = solutions.map(solution => {
    // Konversi format solution dari CSP ke format yang diharapkan softConstraints
    const formattedSolution = {
      sesi: solution.sesi,
      terapis: solution.terapis,
      ruangan: solution.ruangan
    };
    
    return softConstraints.evaluateSolution(formattedSolution, context);
  });
  
  // Urutkan berdasarkan total penalty (ascending - penalty terendah = terbaik)
  evaluatedSolutions.sort((a, b) => a.totalPenalty - b.totalPenalty);
  
  return evaluatedSolutions;
}

/**
 * Mengkonversi solusi CSP ke format yang dibutuhkan oleh sistem
 */
function formatSolutionOutput(solution, context) {
  const { jumlahSesiTotal, inputPenjadwalan } = context;
  const sesiDipesan = hardConstraints.generateRequiredSessions(solution.sesi, jumlahSesiTotal);
  
  return {
    id_terapis: solution.terapis.id_terapis,
    nama_terapis: solution.terapis.nama_terapis,
    id_sif: solution.terapis.id_sif,
    id_ruangan: solution.ruangan.id_ruangan,
    nama_ruangan: solution.ruangan.nama_ruangan,
    tanggal: inputPenjadwalan.tanggal,
    sesi_mulai: solution.sesi,
    sesi_dipesan: sesiDipesan.map(id => ({ id_sesi: id })),
    jumlah_sesi: jumlahSesiTotal,
    recommendations: solution.violations || [],
    totalPenalty: solution.totalPenalty || 0,
    isPerfect: solution.isPerfect || false
  };
}

async function processSchedulingRequest(inputPenjadwalan, okupansiOverride = null, excludePesananId = null) {
  try {
    // TAHAP 1: PERSIAPAN DATA
    logger.info("Tahap 1: Mempersiapkan data dan konteks...");
    
    const [paketDetails, allAvailableTerapis, allAvailableRooms, occupancy, allSesi] = await Promise.all([
      penjadwalanModel.getPaketDetails(inputPenjadwalan.id_paket),
      penjadwalanModel.getAvailableTerapis(inputPenjadwalan.cabangId, inputPenjadwalan.tanggal),
      penjadwalanModel.getAvailableRooms(inputPenjadwalan.cabangId, null),
      okupansiOverride || penjadwalanModel.getOccupancy(inputPenjadwalan.tanggal),
      sesiModel.daftarSesi()
    ]);
    
    const workloads = await penjadwalanModel.getTerapisWorkload(
      allAvailableTerapis.map(t => t.id_terapis), 
      inputPenjadwalan.tanggal, 
      excludePesananId
    );
    
    const { jumlahSesiTotal } = hitungDurasiSesi(
      paketDetails.durasi_paket, 
      inputPenjadwalan.jenis_ruangan, 
      inputPenjadwalan.waktu_tempuh
    );
    
    // Buat konteks lengkap untuk CSP
    const context = { 
      inputPenjadwalan, 
      paketDetails, 
      allSesi, 
      occupancy, 
      workloads, 
      jumlahSesiTotal, 
      allAvailableTerapis, 
      allAvailableRooms 
    };

    // TAHAP 2: PERSIAPAN CSP
    logger.info("Tahap 2: Mempersiapkan CSP domain dan constraints...");
    
    const variables = ['sesi', 'terapis', 'ruangan'];
    const domain = createCSPDomain(context);
    
    // Override fungsi isConsistent di hardConstraints untuk CSP
    const originalIsConsistent = hardConstraints.isConsistent;
    hardConstraints.isConsistent = (variable, value, assignment, cspContext) => {
      return isConsistent(variable, value, assignment, context);
    };
    
    // TAHAP 3: PENCARIAN SOLUSI DENGAN BACKTRACKING
    logger.info("Tahap 3: Memulai pencarian solusi dengan algoritma backtracking...");
    
    const solutions = solve(variables, domain, context);
    
    // Restore fungsi isConsistent asli
    hardConstraints.isConsistent = originalIsConsistent;
    
    // TAHAP 4: EVALUASI DAN PEMILIHAN SOLUSI TERBAIK
    if (solutions.length === 0) {
      logger.warn("Tidak ada solusi valid yang ditemukan dengan algoritma backtracking.");
      return { 
        isPerfect: false, 
        solution: null, 
        message: "Tidak ada jadwal yang bisa dibuat dengan kriteria ini menggunakan CSP backtracking." 
      };
    }
    
    logger.info(`Tahap 4: Ditemukan ${solutions.length} solusi. Mengevaluasi untuk menemukan yang terbaik...`);
    
    const evaluatedSolutions = evaluateAndRankSolutions(solutions, context);
    const bestSolution = evaluatedSolutions[0];
    
    logger.info(`Solusi terbaik ditemukan: Sesi ${bestSolution.sesi}, Terapis ${bestSolution.terapis.nama_terapis}, Ruangan ${bestSolution.ruangan.nama_ruangan}, Penalty: ${bestSolution.totalPenalty}`);
    
    const formattedSolution = formatSolutionOutput(bestSolution, context);
    
    return {
      isPerfect: bestSolution.isPerfect,
      solution: formattedSolution,
      totalSolutionsFound: solutions.length,
      algorithm: 'CSP Backtracking'
    };

  } catch (error) {
    logger.error("Error kritis di dalam processSchedulingRequest:", error);
    throw error;
  }
}

async function buatJadwalDenganCSP(inputDariController) {
  logger.info('Memulai proses penjadwalan baru dengan CSP backtracking...', { input: inputDariController });
  const hasil = await processSchedulingRequest(inputDariController);
  
  if (!hasil.solution) {
    return hasil; 
  }

  // Simpan ke database
  const saved = await penjadwalanModel.createPesananAndJadwal(inputDariController, hasil.solution);
  
  return {
    ...hasil,
    saved
  };
}

async function perbaruiJadwalDenganCSP(id_pesanan, inputPerubahan) {
    logger.info('Memulai proses pembaruan jadwal dengan CSP backtracking...', { id_pesanan, changes: inputPerubahan });
    
    const pesananLama = await penjadwalanModel.getPesananDanJadwal(id_pesanan);
    if (!pesananLama) {
        throw new Error('Pesanan tidak ditemukan.');
    }
    
    const tanggalPencarian = inputPerubahan.tanggal || pesananLama.waktu_pijat.toISOString().split('T')[0];
    
    const inputBaru = {
      id_pasien: pesananLama.id_pasien,
      id_admin: pesananLama.id_administratif,
      cabangId: inputPerubahan.cabangId || pesananLama.id_cabang,
      id_paket: inputPerubahan.id_paket || pesananLama.id_paket,
      jenis_ruangan: inputPerubahan.jenis_ruangan || pesananLama.jenis_ruangan,
      preferensi: inputPerubahan.preferensi,
      waktu_tempuh: inputPerubahan.waktu_tempuh !== undefined ? inputPerubahan.waktu_tempuh : pesananLama.waktu_tempuh,
      tanggal: tanggalPencarian,
      sesi_mulai: inputPerubahan.sesi_mulai || (pesananLama.jadwal_lama?.[0]?.id_sesi || 'S01'),
    };
    
    const okupansiAwal = await penjadwalanModel.getOccupancy(tanggalPencarian);
    const okupansiSimulasi = createOccupancySimulation(okupansiAwal, pesananLama, tanggalPencarian);
    
    return processSchedulingRequest(inputBaru, okupansiSimulasi, id_pesanan);
}

function createOccupancySimulation(okupansiAwal, pesananLama, tanggalPencarian) {
    if (!pesananLama || !pesananLama.waktu_pijat || 
        tanggalPencarian !== pesananLama.waktu_pijat.toISOString().split('T')[0] || 
        !pesananLama.jadwal_lama || pesananLama.jadwal_lama.length === 0 || 
        !pesananLama.jadwal_lama[0].id_sesi) {
        return okupansiAwal;
    }

    const okupansiSimulasi = { terapis: {}, ruangan: {} };
    Object.keys(okupansiAwal.terapis).forEach(key => { 
        okupansiSimulasi.terapis[key] = new Set(okupansiAwal.terapis[key]); 
    });
    Object.keys(okupansiAwal.ruangan).forEach(key => { 
        okupansiSimulasi.ruangan[key] = new Set(okupansiAwal.ruangan[key]); 
    });

    for (const jadwal of pesananLama.jadwal_lama) {
        if (jadwal.id_sesi && jadwal.id_terapis && okupansiSimulasi.terapis[jadwal.id_sesi]) {
            okupansiSimulasi.terapis[jadwal.id_sesi].delete(jadwal.id_terapis);
        }
        if (jadwal.id_sesi && jadwal.id_ruangan && okupansiSimulasi.ruangan[jadwal.id_sesi]) {
            okupansiSimulasi.ruangan[jadwal.id_sesi].delete(jadwal.id_ruangan);
        }
    }
    return okupansiSimulasi;
}

// Fungsi publik lainnya tetap sama
async function getUpcomingBookings(cabangId) {
    return penjadwalanModel.getUpcomingBookings(cabangId);
}

async function cancelBooking(id_pesanan, dibatalkanOleh) {
    const newStatus = dibatalkanOleh === 'MR' ? 'Dibatalkan MR' : 'Dibatalkan Pasien';
    return penjadwalanModel.cancelBooking(id_pesanan, newStatus);
}

module.exports = {
  buatJadwalDenganCSP,
  perbaruiJadwalDenganCSP,
  getUpcomingBookings,
  cancelBooking,
};