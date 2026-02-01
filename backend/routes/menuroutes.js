const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menucontroller");
const { isAdmin } = require('../middleware/authmiddleware');

router.put("/update", isAdmin, menuController.updateMenu);

router.get("/viewMenu", menuController.viewMenu);
router.patch("/updateMenuDay",isAdmin, menuController.changeMenuByDay);


module.exports = router;
