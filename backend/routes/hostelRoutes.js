const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostelcontroller');
const upload = require('../middleware/upload');
const { isAdmin, isUser } = require('../middleware/authmiddleware');

router.get('/', hostelController.getAllHostelsForStudent);
router.post('/', isAdmin, upload.array('images', 5), hostelController.addHostelImages);
module.exports = router;