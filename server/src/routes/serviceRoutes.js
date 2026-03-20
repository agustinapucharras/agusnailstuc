const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// GET /api/v1/services
const { protect, restrictTo } = require('../middleware/auth');

// GET /api/v1/services (Public by default, or filtered)
router.get('/', serviceController.getServices);

// Admin Routes
router.post('/', protect, restrictTo('superadmin', 'admin'), serviceController.createService);
router.put('/:id', protect, restrictTo('superadmin', 'admin'), serviceController.updateService);
router.patch('/:id/toggle', protect, restrictTo('superadmin', 'admin'), serviceController.toggleServiceStatus);
router.delete('/:id', protect, restrictTo('superadmin', 'admin'), serviceController.deleteService);

module.exports = router;
