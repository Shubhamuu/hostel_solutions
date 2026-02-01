
const TempUser = require('../models/tempuser');
const Hostel = require('../models/hostel');
const getUserFromToken = require('../utils/getuserFromToken');
const{verifyToken} = require('../utils/jwtauth');
const User = require('../models/User');
const Room = require('../models/Room');



exports.getHostels = async (req, res) => {
  try {
    const hostels = await Hostel.find().populate('adminId', 'name email');
    res.status(200).json(hostels);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Controller: Get all hostels (for students)
exports.getAllHostelsForStudent = async (req, res) => {
  try {
    // 1. Fetching all documents without field restrictions (.select)
    // We still populate adminId to get the owner's basic contact info
    const hostels = await Hostel.find({isActive: true})
      .populate('adminId', 'name email phoneNumber') 
      .lean(); // Returns plain JSON for better performance
    
    // 2. Check if the collection is empty
    if (!hostels || hostels.length === 0) {
        return res.status(200).json({ 
          success: true, 
          message: 'No hostels found in the database', 
          data: [] 
        });
      }
    

    // 3. Return the full dataset
    res.status(200).json({
      success: true,
      count: hostels.length,
      data: hostels
    });

  } catch (err) {
    console.error('Fetch All Hostels Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error', 
      error: err.message 
    });
  }
};

exports.addHostelImages = async (req, res) => {
  try {
    const user = getUserFromToken(req.headers.authorization?.split(' ')[1]);
    const userdetails = await User.findOne({ email: user.email });

    if(userdetails.approvalStatus !== 'APPROVED'){
      return res.status(403).json({ message: "Only approved admins can add hostel images" });
    }
    const hostelId = userdetails.managedHostelId;

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ message: 'Hostel not found' });
    }
    const imageFiles = req.files; // Array of uploaded files
    if (!imageFiles || imageFiles.length === 0) {
      return res.status(400).json({ message: 'No images uploaded' });
    }
    // Map uploaded files to the required format
    const imageEntries = imageFiles.map(file => ({
      url: file.path, // Assuming 'path' contains the Cloudinary URL
      uploadedAt: new Date()
    }));
    // Append new images to existing images array
    hostel.images.push(...imageEntries);
    await hostel.save();
    res.status(200).json({ message: 'Images added successfully', images: hostel.images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

