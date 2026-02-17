const express = require('express');
const router = express.Router();
const hostelController = require('../controllers/hostelcontroller');
const upload = require('../middleware/upload');
const { isAdmin, isUser, isSuperAdmin } = require('../middleware/authmiddleware');

router.get('/', hostelController.getAllHostelsForStudent);
router.get('/all-hostels', isSuperAdmin, hostelController.getAllHostelsForSuperAdmin);
router.delete('/delete-hostel', isSuperAdmin, hostelController.deleteHostel);

router.post('/addImage', isAdmin, upload.array('images', 5), hostelController.addHostelImages);
router.get('/getHostel', isAdmin, hostelController.getHostelDetails);
router.put('/update', isAdmin, hostelController.updateHostelDetails);
router.get("/nearby", hostelController.getNearbyHostels)
router.delete('/delete-image/:imageId', isAdmin, hostelController.deleteHostelImage)
module.exports = router;
