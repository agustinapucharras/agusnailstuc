const express = require('express');
const { protect } = require('../middleware/auth');
const router = express.Router();
const clientController = require('../controllers/clientController');

// All routes protected
router.use(protect);

router.get('/', clientController.getClients);
router.get('/:id', clientController.getClientDetails);
router.put('/:id', clientController.updateClient);

module.exports = router;
