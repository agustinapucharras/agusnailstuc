const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Public routes
// GET /api/v1/appointments/slots?date=YYYY-MM-DD
router.get('/slots', appointmentController.getAvailableSlots);

// POST /api/v1/appointments
router.post('/', appointmentController.createAppointment);

// GET /api/v1/appointments/occupied-days?year=2026&month=2
router.get('/occupied-days', appointmentController.getOccupiedDays);

// Protected Routes (Admin)
router.use(protect);

router.get('/stats', appointmentController.getStats);
router.get('/', appointmentController.getAppointments);
router.get('/:id', appointmentController.getAppointmentById);
router.patch('/:id/status', appointmentController.updateAppointmentStatus);
router.post('/:id/reminder', appointmentController.sendReminder);
router.put('/:id/reschedule', appointmentController.rescheduleAppointment);

module.exports = router;
