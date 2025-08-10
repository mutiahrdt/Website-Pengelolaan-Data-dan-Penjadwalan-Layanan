const penjadwalanService = require('./penjadwalanService');
const penjadwalanModel = require('./penjadwalanModel');
const { Logger } = require('./utils/logger');
const { validateInput, sanitizeInput } = require('./utils/validator');

const logger = Logger('PenjadwalanController');

const handleSchedulingRequest = async (req, res, isUpdate = false) => {
  try {
    const { id_pesanan } = req.params;
    const { id_admin, id_cabang } = req.user;

    if (!id_admin || !id_cabang) {
      return res.status(401).json({ 
        success: false, 
        message: 'Informasi admin atau cabang tidak ditemukan.' 
      });
    }

    if (isUpdate && (!id_pesanan || id_pesanan.length < 1)) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID pesanan tidak valid untuk pembaruan.' 
      });
    }

    // 2. Validasi Input dengan aturan yang disesuaikan
    const validationRules = {
      id_pasien: { required: !isUpdate, type: 'string' },
      id_paket: { required: true, type: 'string' },
      tanggal: { required: true, type: 'date' },
      sesi_mulai: { required: true, type: 'string' },
      jenis_ruangan: { required: true, type: 'string' },
      waktu_tempuh: { required: false, type: 'number' },
      preferensi: { required: false, type: 'object' }
    };

    const validationResult = validateInput(req.body, validationRules);
    if (!validationResult.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data input tidak valid', 
        errors: validationResult.errors 
      });
    }

    const sanitizedInput = sanitizeInput(req.body);
    const serviceInput = { 
      ...sanitizedInput, 
      id_admin, 
      cabangId: id_cabang // Sesuai dengan yang diharapkan service
    };

    // 3. Panggil Service CSP untuk Mencari Solusi Jadwal
    logger.info(`${isUpdate ? 'Memperbarui' : 'Membuat'} jadwal dengan CSP untuk:`, {
      id_pesanan: isUpdate ? id_pesanan : 'baru',
      tanggal: serviceInput.tanggal,
      sesi_mulai: serviceInput.sesi_mulai
    });

    const result = isUpdate 
      ? await penjadwalanService.perbaruiJadwalDenganCSP(id_pesanan, serviceInput)
      : await penjadwalanService.buatJadwalDenganCSP(serviceInput);

    // 4. Log hasil pencarian solusi
    logger.info(`Hasil pencarian CSP:`, {
      isPerfect: result.isPerfect,
      hasSolution: !!result.solution,
      totalSolutionsFound: result.totalSolutionsFound || 0,
      algorithm: result.algorithm || 'CSP Backtracking'
    });

    // 5. Tangani Hasil dari Pencarian Solusi
    // Kasus 1: Tidak ada solusi sama sekali
    if (!result.solution) {
      logger.warn(`Tidak ada solusi CSP ditemukan untuk input:`, serviceInput);
      return res.status(200).json({
        success: false,
        status: 'NO_SOLUTION_FOUND',
        message: result.message || "Tidak ada jadwal yang bisa dibuat dengan kriteria ini menggunakan CSP backtracking.",
        details: {
          algorithm: result.algorithm || 'CSP Backtracking',
          totalSolutionsFound: result.totalSolutionsFound || 0
        }
      });
    }

    // Kasus 2: Ditemukan solusi, tapi tidak sempurna (soft constraint dilanggar)
    if (!result.isPerfect) {
      logger.info(`Solusi alternatif CSP ditemukan (penalty: ${result.solution.totalPenalty}), membutuhkan konfirmasi pengguna.`);
      return res.status(200).json({
        success: true,
        status: 'CONFIRMATION_REQUIRED',
        message: 'Ditemukan jadwal alternatif melalui CSP backtracking. Mohon konfirmasi.',
        solution: {
          ...result.solution,
          algorithm: result.algorithm,
          totalSolutionsFound: result.totalSolutionsFound
        },
        originalInput: { 
          ...serviceInput, 
          id_pesanan: isUpdate ? id_pesanan : null 
        }
      });
    }
    
    // Kasus 3: Solusi sempurna, langsung simpan
    logger.info(`Solusi sempurna CSP ditemukan. Menyimpan secara otomatis...`);
    
    let savedResult;
    if (isUpdate) {
      // Update jadwal yang sudah ada
      savedResult = await penjadwalanModel.updatePesananDanJadwal(
        id_pesanan, 
        serviceInput, 
        result.solution
      );
    } else {
      // Buat jadwal baru dengan pengecekan denda
      savedResult = await transaksiHarianService.buatPesananDenganDenda(
        serviceInput, 
        result.solution
      );
    }
    
    return res.status(201).json({
      success: true,
      status: 'SAVED',
      message: `Jadwal berhasil ${isUpdate ? 'diperbarui' : 'dibuat'} menggunakan CSP backtracking!`,
      data: {
        ...savedResult,
        scheduling_details: {
          algorithm: result.algorithm,
          totalSolutionsFound: result.totalSolutionsFound,
          isPerfect: result.isPerfect
        }
      }
    });

  } catch (error) {
    logger.error(`Error dalam ${isUpdate ? 'update' : 'create'} scheduling request:`, { 
      message: error.message, 
      stack: error.stack,
      input: req.body
    });
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Terjadi kesalahan internal server dalam proses CSP scheduling'
    });
  }
};

// Wrapper untuk membedakan endpoint create dan update
const createSchedule = (req, res) => {
  logger.info('Endpoint createSchedule dipanggil');
  return handleSchedulingRequest(req, res, false);
};

const updateSchedule = (req, res) => {
  logger.info('Endpoint updateSchedule dipanggil', { id_pesanan: req.params.id_pesanan });
  return handleSchedulingRequest(req, res, true);
};

const confirmAndSaveSchedule = async (req, res) => {
  try {
    const { id_admin, id_cabang } = req.user;
    const { solution, input } = req.body;
    
    // Validasi input konfirmasi
    if (!solution || !input) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data solusi dan input diperlukan untuk konfirmasi.' 
      });
    }

    if (!solution.id_terapis || !solution.id_ruangan || !solution.sesi_dipesan) {
      return res.status(400).json({ 
        success: false, 
        message: 'Data solusi tidak lengkap: terapis, ruangan, dan sesi diperlukan.' 
      });
    }
    
    const serviceInput = { 
      ...input, 
      id_admin, 
      cabangId: id_cabang // Konsisten dengan service
    };
    
    logger.info('Konfirmasi dan penyimpanan jadwal CSP:', {
      isUpdate: !!input.id_pesanan,
      terapis: solution.nama_terapis,
      ruangan: solution.nama_ruangan,
      sesi_mulai: solution.sesi_mulai,
      totalPenalty: solution.totalPenalty
    });
    
    let savedResult;
    
    if (input.id_pesanan) {
      // Konfirmasi untuk UPDATE jadwal yang sudah ada
      savedResult = await penjadwalanModel.updatePesananDanJadwal(
        input.id_pesanan, 
        serviceInput, 
        solution
      );
    } else {
      // Konfirmasi untuk CREATE jadwal baru
      savedResult = await transaksiHarianService.buatPesananDenganDenda(
        serviceInput, 
        solution
      );
    }

    res.status(201).json({
      success: true,
      status: 'SAVED',
      message: "Jadwal alternatif berhasil dikonfirmasi dan disimpan!",
      data: {
        ...savedResult,
        confirmed_solution: {
          penalty: solution.totalPenalty,
          recommendations: solution.recommendations || []
        }
      }
    });

  } catch (error) {
    logger.error('Error dalam confirmAndSaveSchedule:', { 
      message: error.message, 
      stack: error.stack,
      input: req.body
    });
    res.status(500).json({ 
      success: false, 
      message: 'Gagal menyimpan jadwal yang dikonfirmasi.', 
      error: error.message 
    });
  }
};

const getAvailability = async (req, res) => {
  try {
    const { tanggal } = req.query;
    const { id_cabang } = req.user; 
    
    if (!tanggal || !id_cabang) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parameter tanggal dan informasi cabang diperlukan.' 
      });
    }

    logger.info('Mendapatkan data ketersediaan:', { tanggal, id_cabang });
    
    const [availableTerapis, allRooms, bookings] = await Promise.all([
      penjadwalanModel.getAvailableTerapis(id_cabang, tanggal),
      penjadwalanModel.getAvailableRooms(id_cabang, null),
      penjadwalanModel.getBookingsForDay(tanggal, id_cabang) 
    ]);

    res.status(200).json({
      success: true,
      message: 'Data ketersediaan berhasil diambil',
      data: {
        tanggal: tanggal,
        terapis: availableTerapis.map(t => ({ 
          id_terapis: t.id_terapis, 
          nama_terapis: t.nama_terapis, 
          inisial_terapis: t.inisial_terapis,
          id_sif: t.id_sif,
          sif_mulai: t.sif_mulai, 
          sif_selesai: t.sif_selesai,
          waktu_kehadiran_aktual: t.waktu_kehadiran_aktual,
          gender_terapis: t.gender_terapis, // Tambahan untuk preferensi
          keahlian: t.keahlian || [] // Informasi keahlian
        })),
        ruangan: allRooms.map(r => ({ 
          id: r.id_ruangan, 
          nama: r.nama_ruangan,
          jenis_ruangan: r.jenis_ruangan // Tambahan untuk filter
        })),
        bookings: bookings 
      }
    });

  } catch (error) {
    logger.error('Error dalam getAvailability:', { 
      message: error.message, 
      stack: error.stack,
      query: req.query
    });
    res.status(500).json({ 
      success: false, 
      message: 'Terjadi kesalahan saat mengambil data ketersediaan' 
    });
  }
};

const getUpcomingBookings = async (req, res) => {
  try {
    const { id_cabang } = req.user;
    
    if (!id_cabang) {
      return res.status(401).json({ 
        success: false, 
        message: 'Informasi cabang tidak ditemukan di token.' 
      });
    }
    
    logger.info('Mendapatkan upcoming bookings untuk cabang:', id_cabang);
    
    const bookings = await penjadwalanService.getUpcomingBookings(id_cabang);
    
    res.status(200).json({
      success: true,
      message: 'Daftar pesanan aktif berhasil diambil.',
      data: {
        bookings: bookings,
        total: bookings.length,
        cabang_id: id_cabang
      }
    });

  } catch (error) {
    logger.error('Error dalam getUpcomingBookings:', { 
      message: error.message, 
      stack: error.stack,
      cabang_id: req.user?.id_cabang
    });
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Terjadi kesalahan saat mengambil daftar pesanan' 
    });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id_pesanan } = req.params;
    const { status_jadwal, alasan_pembatalan } = req.body;
    const { id_admin } = req.user;
    
    // Validasi input
    if (!id_pesanan) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID pesanan diperlukan.' 
      });
    }
    
    if (!status_jadwal || !['Dibatalkan MR', 'Dibatalkan Pasien'].includes(status_jadwal)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status pembatalan harus "Dibatalkan MR" atau "Dibatalkan Pasien".' 
      });
    }

    logger.info('Membatalkan booking:', { 
      id_pesanan, 
      status_jadwal, 
      admin: id_admin,
      alasan: alasan_pembatalan 
    });
    
    // Tentukan siapa yang membatalkan berdasarkan status
    const dibatalkanOleh = status_jadwal === 'Dibatalkan MR' ? 'MR' : 'Pasien';
    
    const result = await penjadwalanService.cancelBooking(id_pesanan, dibatalkanOleh);
    
    res.status(200).json({ 
      success: true, 
      message: `Jadwal berhasil dibatalkan dengan status: ${status_jadwal}`,
      data: {
        id_pesanan,
        status_baru: status_jadwal,
        dibatalkan_oleh: dibatalkanOleh,
        waktu_pembatalan: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error dalam cancelBooking:', { 
      message: error.message, 
      stack: error.stack,
      params: req.params,
      body: req.body
    });
    res.status(500).json({ 
      success: false, 
      message: 'Gagal membatalkan jadwal: ' + error.message 
    });
  }
};

// Handler baru untuk mendapatkan detail algoritma CSP (untuk debugging/monitoring)
const getCSPDetails = async (req, res) => {
  try {
    const { tanggal } = req.query;
    const { id_cabang } = req.user;
    
    if (!tanggal || !id_cabang) {
      return res.status(400).json({
        success: false,
        message: 'Parameter tanggal dan informasi cabang diperlukan.'
      });
    }

    // Ambil data yang sama seperti yang digunakan CSP
    const [allSesi, allTerapis, allRooms, occupancy] = await Promise.all([
      require('../sesi/sesiModel').daftarSesi(),
      penjadwalanModel.getAvailableTerapis(id_cabang, tanggal),
      penjadwalanModel.getAvailableRooms(id_cabang, null),
      penjadwalanModel.getOccupancy(tanggal)
    ]);

    res.status(200).json({
      success: true,
      message: 'Detail CSP domain berhasil diambil',
      data: {
        tanggal,
        domain_size: {
          sesi: allSesi.length,
          terapis: allTerapis.length,
          ruangan: allRooms.length
        },
        total_combinations: allSesi.length * allTerapis.length * allRooms.length,
        occupancy_summary: {
          terapis_occupied: Object.keys(occupancy.terapis).reduce((sum, sesi) => 
            sum + occupancy.terapis[sesi].size, 0),
          ruangan_occupied: Object.keys(occupancy.ruangan).reduce((sum, sesi) => 
            sum + occupancy.ruangan[sesi].size, 0)
        }
      }
    });

  } catch (error) {
    logger.error('Error dalam getCSPDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail CSP'
    });
  }
};

// Ekspor semua handler
module.exports = {
  createSchedule,
  updateSchedule,
  confirmAndSaveSchedule,
  getAvailability,
  getUpcomingBookings,
  cancelBooking,
  getCSPDetails // Handler baru untuk monitoring CSP
};