const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// All routes protected and restricted to Admin
router.use(protect);
router.use(restrictTo('superadmin', 'admin'));

router.get('/', employeeController.getEmployees);
router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.patch('/:id/toggle', employeeController.toggleEmployeeStatus);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
