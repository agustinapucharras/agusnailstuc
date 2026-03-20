const express = require('express');
const router = express.Router();
const { login, employeeLogin, seedAdmin, forgotPassword } = require('../controllers/authController');

router.post('/login', login);
router.post('/employee/login', employeeLogin);
router.post('/forgot-password', forgotPassword);
router.get('/seed', seedAdmin);

module.exports = router;
