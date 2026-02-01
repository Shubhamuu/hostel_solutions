const express = require("express");
const router = express.Router();
const feeController = require("../controllers/feeController");
const { isAdmin, isUser } = require('../middleware/authmiddleware');
router.put("/updatefee", feeController.updateFee);

router.get("/viewFee",isAdmin, feeController.viewFeeAdmin);
router.get("/viewFeeByStudent",isUser, feeController.viewFeeByStudent);

module.exports = router;