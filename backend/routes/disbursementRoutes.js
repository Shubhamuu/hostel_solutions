const express = require('express');
const router = express.Router();
const disbursementController = require('../controllers/disbursementController');
const { isSuperAdmin, isAdmin } = require('../middleware/authmiddleware');

// SuperAdmin routes
router.post('/disburse', isSuperAdmin, disbursementController.createDisbursement);
router.get('/all', isSuperAdmin, disbursementController.getAllDisbursements);
router.put('/update-status', isSuperAdmin, disbursementController.updateDisbursementStatus);

// Admin routes
router.get('/my-bills', isAdmin, disbursementController.getDisbursementsForAdmin);
router.post('/request', isAdmin, disbursementController.requestDisbursement);

module.exports = router;
