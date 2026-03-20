const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const { getConfig, updateConfig, getEmailTemplate, updateEmailTemplate, getSmsTemplate, updateSmsTemplate } = require('../controllers/configController');
const router = express.Router();

// Protect all routes and restrict to Admins
router.use(protect);
router.use(restrictTo('superadmin', 'admin'));

router.get('/', getConfig);
router.put('/', updateConfig);

router.get('/email-template', getEmailTemplate);
router.put('/email-template', updateEmailTemplate);

router.get('/sms-template', getSmsTemplate);
router.put('/sms-template', updateSmsTemplate);

module.exports = router;
