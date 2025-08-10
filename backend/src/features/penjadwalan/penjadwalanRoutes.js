const express = require('express');
const router = express.Router();
const penjadwalanController = require('./penjadwalanController');
const { verifyToken } = require('../../middlewares/auth');

router.get('/upcoming', verifyToken, penjadwalanController.getUpcomingBookings);
router.post('/create', verifyToken, penjadwalanController.createSchedule);
router.post('/update/:id_pesanan', verifyToken, penjadwalanController.updateSchedule);
router.post('/confirm', verifyToken, penjadwalanController.confirmAndSaveSchedule);
router.get('/availability', verifyToken, penjadwalanController.getAvailability);
router.delete('/cancel/:id_pesanan', verifyToken, penjadwalanController.cancelBooking);

module.exports = router;