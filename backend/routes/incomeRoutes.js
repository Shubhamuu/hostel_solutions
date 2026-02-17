const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const {  isSuperAdmin } = require('../middleware/authmiddleware');;

// Protected route for superadmin analytics
router.get('/analytics', isSuperAdmin, incomeController.getIncomeAnalytics);

module.exports = router;
