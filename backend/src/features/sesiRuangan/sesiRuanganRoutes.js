// file: backend/src/features/sesiRuangan/sesiRuanganRoutes.js

const express = require('express');
const router = express.Router();
const sesiRuanganController = require('./sesiRuanganController');
const { verifyToken } = require('../../middlewares/auth'); // Path ini juga perlu dipastikan benar

// Endpoint ini akan berada di /api/sesi-ruangan/sync
router.post('/sesi-ruangan/sync', verifyToken, sesiRuanganController.runSync);

module.exports = router;