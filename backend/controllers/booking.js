const Room = require('../models/Room');

const upload = require('../middleware/upload');
const { verifyToken } = require('../utils/jwtauth');
const mongoose = require('mongoose');
const Fee = require('../models/Fee');
//const SeaterType = require('../models/SeaterType');
const getUserFromToken = require('../utils/getuserFromToken');
const User = require('../models/User');
const Booking = require('../models/Booking');