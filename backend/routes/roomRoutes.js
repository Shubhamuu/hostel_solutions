const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const upload = require('../middleware/upload');
const { isAdmin, isUser } = require('../middleware/authmiddleware');
//const { authenticate } = require('../middleware/authmiddleware');
// Upload multiple images to a room
router.post('/create', isAdmin, upload.array('images', 5), roomController.createRoom);
router.get('/getallrooms',isAdmin, roomController.getAllRooms);
router.get('/getroom/:roomId', roomController.getRoomDetails);
//router.post('/:roomId/images', isAdmin, upload.array('images', 5), roomController.uploadRoomImages);
router.post('/assignroom', isAdmin, roomController.assignRoom);
router.post('/confirmbookingadmin', isAdmin, roomController.confirmBookings);
router.post('/bookroom',isUser, roomController.bookRoom);
//router.get('/:roomId/images', roomController.getRoomImages);
router.get('/getAllBooking',isAdmin, roomController.getAllBookings);
//router.get('/getallroom', isAdmin, roomController.getAllRooms);
// Static route for booking details
router.get('/mybookings', isUser, roomController.getBookingDetails);
router.post('/cancelbooking',isUser,roomController.cancelBooking);
router.post('/cancelBookingAdmin',isAdmin, roomController.cancelBooking);
// Dynamic route for available rooms
router.get('/:hostelId', roomController.availableRooms);
router.post('/leave/:roomId',isUser,roomController.leaveRoom);
router.put('/updateroom/:roomId', isAdmin, upload.array('images', 5), roomController.updateroomDetails);
module.exports = router;
