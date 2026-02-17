const express = require("express");
const router = express.Router();
const feeController = require("../controllers/feeController");
const { isAdmin, isUser, isSuperAdmin } = require('../middleware/authmiddleware');
router.put("/updatefee", feeController.updateFee);

router.get("/viewFee", isAdmin, feeController.viewFeeAdmin);
router.get("/viewFeeByStudent", isUser, feeController.viewFeeByStudent);
router.get("/all-fees", isSuperAdmin, feeController.getAllFeesForSuperAdmin);

module.exports = router;