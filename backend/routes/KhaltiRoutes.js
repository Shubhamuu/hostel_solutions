const express = require('express');
const router = express.Router();
const khaltiController = require('../controllers/KhaltiController');
const { protect } = require('../middleware/authmiddleware');
const { isAdmin, isUser } = require('../middleware/authmiddleware');
// POST /api/khalti/verify

router.post('/fee/initiate',isUser, protect, khaltiController.initiateKhaltiFeePayment);
router.post('/verify',isUser, protect, khaltiController.verifyKhaltiFeePayment);
module.exports = router;


