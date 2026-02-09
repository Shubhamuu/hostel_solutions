const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const getUserFromToken = require('../utils/getuserFromToken');
const{verifyToken} = require('../utils/jwtauth');
const User = require('../models/User');
const Room = require('../models/Room');
const Hostel = require('../models/hostel');
const Booking = require("../models/Booking");
const Fee = require("../models/Fee");
const userRegistred = require("../utils/sendotp");
exports.getme = async (req, res) => {
token = req.headers.authorization?.split(' ')[1];

 try {
  const user = getUserFromToken(token);
  const userData = await User.findOne({ email: user.email }).select(
  "hostelname hostelId _id name email role approvalStatus"
);

    res.json({
    message: 'User details fetched successfully',
    user: userData,
  });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }


  
}

exports.getMyProfile = async (req, res) => {
token = req.headers.authorization?.split(' ')[1];

 const userData=verifyToken(token);
    //console.log("userData", userData);
    if (!userData) {
    return res.status(403).json({ message: 'Invalid or expired token' });
    }
  try {
    const user = getUserFromToken(token);
    res.json({
    message: 'User details fetched successfully',
    user: userData,
  });

  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// // Update profile (e.g. name, password)
// router.put("/update", authenticateToken, userController.updateProfile);
exports.updateProfile = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const userData = verifyToken(token);
  
  if (!userData) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  try {
    const { name, email, password } = req.body;
    const user = await User.findById(userData.id || userData.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email;
    }
    if (password) {
      user.passwordHash = await bcrypt.hash(password, 10);
    }

    user.updatedAt = new Date();
    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.passwordHash;

    res.json({ 
      message: 'Profile updated successfully', 
      user: userResponse 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
// //  Delete user (optional, for admin or user)
// router.delete("/delete", authenticateToken, userController.deleteAccount);
exports.deleteAccount = async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// // Get all users (admin only)
// router.get("/", authenticateToken, userController.getAllUsers);
exports.getAllUsers = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

  try {
    const admin = getUserFromToken(token);
    const admins = await User.findOne({email:admin.email});
    const hostelId = admins.managedHostelId;
 const users = await User.find({ hostelId: hostelId }, '-passwordHash -createdAt -updatedAt -emailVerificationCode'); // exclude password field
 console.log(users, hostelId);   
 res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}   
exports.getFeesDetails = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate('feesDetails');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ feesDetails: user.feesDetails });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

// Get student's room with roommates
exports.getMyRoom = async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const userData = getUserFromToken(token);
  const email=userData.email;
  if (!userData) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }

  try {
    const user = await User.findOne({ email }).populate('roomId');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.roomId) {
      return res.status(404).json({ 
        message: 'No room allocated', 
        hasRoom: false 
      });
    }

    // Get room details
    const room = await Room.findById(user.roomId);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Get all roommates (students in the same room)
    const roommates = await User.find({ 
      roomId: user.roomId,
      _id: { $ne: user._id } // Exclude current user
    }).select('name email photoUrl');

    // Get current user info for roommates list
    const currentUserInfo = {
      name: user.name,
      email: user.email,
      photoUrl: user.photoUrl,
      isCurrentUser: true
    };

    // Combine current user with roommates
    const allRoommates = [currentUserInfo, ...roommates.map(rm => ({
      name: rm.name,
      email: rm.email,
      photoUrl: rm.photoUrl,
      isCurrentUser: false
    }))];

    // Prepare room data
    const roomData = {
      _id: room._id,
      roomNumber: room.roomNumber,
      name: room.name || `Room ${room.roomNumber}`,
      type: room.type,
      maxCapacity: room.maxCapacity,
      currentOccupancy: room.currentOccupancy || 0,
      price: room.price,
      description: room.description || '',
      images: room.images || [],
      isActive: room.isActive !== false,
      createdAt: room.createdAt,
      roommates: allRoommates,
      status: room.isActive === false ? 'INACTIVE' : 
              (room.currentOccupancy >= room.maxCapacity ? 'FULL' : 'OCCUPIED')
    };

    res.status(200).json({
      message: 'Room details fetched successfully',
      room: roomData,
      hasRoom: true
    });
  } catch (err) {
    console.error('Error fetching room:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
// // verify user email
// router.post("/verify-user", authenticateToken, userController.verifyuserEmail);
exports.verifyuserEmail = async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const {email}  = req.body;
  const userData=verifyToken(token);
    if (!userData) {
    return res.status(403).json({ message: 'Invalid or expired token' });
    }
if (userData.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
  try {
   const user = await User.findOne({email});

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }   
    if (user.isVerified) {
      return res.status(404).json({ message: 'user verified' });
    }
    else {
      user.isVerified = true;
      user.verifiedAt = new Date();
        await user.save();
        return res.status(200).json({ message: 'User verified successfully' });
}
  }
catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
}

exports.viewAllAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: 'ADMIN' }, '-passwordHash'); // exclude password field
    res.status(200).json(admins);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}
exports.verifyAdmin = async (req, res) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }

    const admin = await User.findById(adminId);
    const hostel = await Hostel.findOne({ adminId: adminId });
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (admin.approvalStatus === 'APPROVED') {
      return res.status(400).json({ message: 'Admin already approved' });
    }

    if (admin.approvalStatus === 'REJECTED') {
      return res.status(400).json({ message: 'Rejected admin cannot be approved' });
    }

    admin.approvalStatus = 'APPROVED';
    admin.approvedBy = req.user._id; // SUPER_ADMIN ID
    admin.approvedAt = new Date();
    hostel.isActive = true;
    await hostel.save();
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Admin approved successfully'
    });

  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};

exports.rejectAdmin = async (req, res) => {
  try {
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }

    const admin = await User.findById(adminId);

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(404).json({ message: 'Admin not found' });
    }

    if (admin.approvalStatus === 'APPROVED') {
      return res.status(400).json({ message: 'Approved admin cannot be rejected' });
    }

    admin.approvalStatus = 'REJECTED';
    admin.approvedBy = req.user._id; // super admin
    admin.approvedAt = new Date();

    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Admin rejected successfully'
    });

  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};
exports.deleteAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;
    if (!adminId) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'ADMIN') {
      return res.status(404).json({ message: 'Admin not found' });
    }
    await User.findByIdAndDelete(adminId);
    res.status(200).json({
      success: true,
      message: 'Admin deleted successfully'
    });
  }
  catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};

exports.reapplyverifyAdmin = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const userData = getUserFromToken(token);
    const {hostelName, hostelAddress} = req.body;
     const verificationDocuments = req.files
      ? req.files.map(file => ({
          type: req.body.documentType || 'UNKNOWN',
          url: file.path,
          public_id: file.filename,
        }))
      : [];
    if (!userData) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    console.log("userData", userData);
    const admin = await User.findOne({ email: userData.email });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(404).json({ message: 'Admin not found' });
    }
    if (admin.approvalStatus === 'APPROVED') {
      return res.status(400).json({ message: 'Admin already approved' });
    }
    admin.approvalStatus = 'PENDING';
    if(admin.managedHostelId){
  const hostel = await Hostel.findById(admin.managedHostelId);
  if(hostel){
    hostel.name = hostelName || hostel.name;
    hostel.address = hostelAddress || hostel.address;
    hostel.isActive = false;  
    await hostel.save();
  }
    }
else {
   if(!hostelName || !hostelAddress){
      return res.status(400).json({ message: 'Hostel name and address are required' });
    };
    
  const newHostel = new Hostel({
   
    name: hostelName,
    address: hostelAddress,
    adminId: admin._id,
    isActive: false,
  });
  const savedHostel = await newHostel.save();
  admin.managedHostelId = savedHostel._id;
  admin.hostelname = hostelName;
}
    admin.verificationDocuments = verificationDocuments;
    await admin.save();
  
    res.status(200).json({
      success: true,
      message: 'Re-applied for admin verification successfully',
      updatedUser: admin.id ? {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        approvalStatus: admin.approvalStatus,
        managedHostelId: admin.managedHostelId,
        hostelname: admin.hostelname,
      } : null
    });
  } catch (err) {
    res.status(500).json({
      message: 'Server error',
      error: err.message
    });
  }
};

exports.createUserAdmin = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, roomId, feeAmount, password } = req.body;

    // 1️⃣ Validation
    if (!name || !email || !roomId || !feeAmount || !password) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "name, email, roomId, feeAmount, password are required",
      });
    }

    // 2️⃣ Check existing user
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      return res.status(400).json({ message: "User already exists" });
    }

    // 3️⃣ Find room
    const room = await Room.findById(roomId).session(session);
    if (!room) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Room not found" });
    }

    if (!room.isActive) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Room is inactive" });
    }

    if (room.currentOccupancy >= room.maxCapacity) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Room is full" });
    }

    // 4️⃣ Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 5️⃣ Create user
    const [user] = await User.create(
      [
        {
          name,
          email,
          passwordHash,
          role: "STUDENT",
          roomId: room._id,
          roomNumber: room.roomNumber,
          hostelId: room.hostelId,
          moveInDate: new Date(),
        },
      ],
      { session }
    );


  

    // 7️⃣ Create & pay fee
    const [fee] = await Fee.create(
      [
        {
          studentId: user._id,
          hostelId: room.hostelId,
          amountDue: feeAmount,
          amountPaid: feeAmount,
          amount: feeAmount,
          status: "PAID",
          dueDate: new Date(),        // admin-paid immediately
          paidAt: new Date(),
          paymentReference: ["ADMIN"],
          KhaltipaymentStatus: "PAID",
        },
      ],
      { session }
    );

    // 8️⃣ Update room occupancy ONLY
    room.currentOccupancy += 1;
    await room.save({ session });

    // 9️⃣ Commit transaction
      await userRegistred.userRegistered(name, email, password);
    await session.commitTransaction();
   
    session.endSession();

    return res.status(201).json({
      message: "Student created and assigned successfully",
      user,
      fee,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error("Create user admin error:", err);
    return res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
};

