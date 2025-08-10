// file: backend/src/features/sesiRuangan/sesiRuanganController.js

const sesiRuanganService = require('./sesiRuanganService');

const sesiRuanganController = {
  runSync: async (req, res) => {
    try {
      const result = await sesiRuanganService.synchronizeSesiRuangan();
      res.status(200).json({
        success: true,
        message: 'Sinkronisasi Sesi-Ruangan berhasil diselesaikan.',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat sinkronisasi.',
        error: error.message
      });
    }
  }
};

module.exports = sesiRuanganController;