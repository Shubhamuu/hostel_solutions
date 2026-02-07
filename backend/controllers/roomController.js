const Room = require('../models/Room');

const upload = require('../middleware/upload');
const { verifyToken } = require('../utils/jwtauth');
const mongoose = require('mongoose');
const Fee = require('../models/Fee');
//const SeaterType = require('../models/SeaterType');
const getUserFromToken = require('../utils/getuserFromToken');
const User = require('../models/User');
const Booking = require('../models/Booking');
exports.createRoom = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    const user = getUserFromToken(req.headers.authorization?.split(' ')[1]);
    const userdetails = await User.findOne({ email: user.email });
    if (userdetails.approvalStatus !== 'APPROVED') {
      return res.status(403).json({ message: "Only approved admins can create rooms" });
    }
    const hostelId = userdetails.managedHostelId;
    const { description, price, capacity, roomNumber, type } = req.body;
    console.log("Uploaded files:", description);
    // Basic validation
    if (!description || !capacity || !roomNumber || !price || !type || !hostelId) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingRoom = await Room.findOne({ roomNumber: roomNumber, hostelId: hostelId });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room with this number already exists in this hostel' });
    }
    console.log("here");
    const images = req.files.map(file => ({
      url: file.path,
      uploadedAt: new Date(),
    }));

    const newRoom = new Room({

      description: description.trim(),
      price: Number(price),
      hostelId: hostelId,
      maxCapacity: Number(capacity),
      type: type.trim(),
      images: images,
      price: Number(price),
      isAvailable: true,
      roomNumber: roomNumber.trim(),
      createdAt: new Date(),
      // Assuming initial occupancy is 0
    });

    await newRoom.save();
    res.status(201).json({ message: 'Room created successfully', room: newRoom });

  } catch (err) {
    console.error('Error creating room:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
exports.getRoomDetails = async (req, res) => {
  const roomId = req.params.roomId
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    res.json(room);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });

  }
}

exports.getAllRooms = async (req, res) => {
  try {
    const user = getUserFromToken(req.headers.authorization?.split(' ')[1]);
    const userdetails = await User.findOne({ email: user.email });
    const hostelId = userdetails.managedHostelId;
    const rooms = await Room.find({ hostelId: hostelId });
    console.log("hostelId:", hostelId);
    console.log("rooms fetched:", rooms);
    if (!rooms || rooms.length === 0) {
      return res.status(404).json({ message: 'No rooms found in this hostel' });
    }
    console.log("rooms:", rooms, userdetails);
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    /*const roomsWithFullImageUrls = rooms.map(room => ({
      ...room.toObject(),
      images: room.images.map(img => ({
        ...img,
        fullUrl: `${baseUrl}${img.url}`
      }))
    }));
    res.json({
  message: "Rooms fetched successfully",
  rooms: rooms, // original raw data (optional)
  roomsWithFullImageUrls: roomsWithFullImageUrls
});
*/    res.json(rooms);

  } catch (err) {
    console.error('Error fetching rooms:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};
exports.availableRooms = async (req, res) => {
  try {
    const { hostelId } = req.params; // or req.query.hostelId

    if (!hostelId) {
      return res.status(400).json({ message: "Hostel ID is required" });
    }

    // Find rooms in the specific hostel that are not full
    const rooms = await Room.find({
      hostelId: hostelId,
      $expr: { $lt: ["$currentOccupancy", "$maxCapacity"] },
    });

    if (!rooms || rooms.length === 0) {
      return res.status(404).json({ message: "No available rooms found" });
    }

    res.json(rooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.bookRoom = async (req, res) => {
  try {
    // 🔐 Verify token (assumes Bearer token)
    const token = verifyToken(req.headers.authorization?.split(" ")[1]);
    const useremail = token.email;
  
    // 🧾 Validate request BEFORE transaction
    const { roomId, duration, moveInDate } = req.body;

    if (!roomId) {
      return res.status(400).json({ message: "Room ID is required" });
    }
    const room = await Room.findOne({ _id: roomId })
    const hostelId = room.hostelId;
    console.log("hostelId", hostelId);
    if (!hostelId) {
      return res.status(404).json({ message: "Room not found in hostel" });
    }

    if (!duration || duration < 1) {
      return res
        .status(400)
        .json({ message: "Valid duration is required (minimum 1 month)" });
    }

    if (!moveInDate) {
      return res.status(400).json({ message: "Move-in date is required" });
    }

    const selectedDate = new Date(moveInDate);
    if (isNaN(selectedDate.getTime())) {
      return res.status(400).json({ message: "Invalid move-in date" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return res
        .status(400)
        .json({ message: "Move-in date cannot be in the past" });
    }

    // 🧮 Normalize values
    const months = parseInt(duration, 10);

    // 🗓 Clone dates safely
    const moveIn = new Date(selectedDate);

    const dueDate = new Date(moveIn);
    dueDate.setMonth(dueDate.getMonth() + 1);

    const bookingEndDate = new Date(moveIn);
    bookingEndDate.setMonth(bookingEndDate.getMonth() + months);

    // 🔁 Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 👤 Find user
      const user = await User.findOne({ email: useremail }).session(session);

      if (!user) throw new Error("USER_NOT_FOUND");
      if (user.roomId) throw new Error("ALREADY_HAS_ROOM");
      const bookingExisting = await Booking.findOne({ studentId: user._id, status: "PENDING" }).session(session);
      if (bookingExisting) throw new Error("ALREADY_HAS_PENDING_BOOKING");
      const existingFees = await Fee.findOne({
  studentId: user._id,
  status: { $in: ["PENDING", "PARTIAL"] }, // Only block if fee not paid
}).session(session);

if (existingFees) throw new Error("FEE_EXISTS");


      // 🏠 Room query (supports _id or roomNumber)
      const roomQuery = {
        isActive: true,
        $expr: { $lt: ["$currentOccupancy", "$maxCapacity"] },
      };

      if (mongoose.Types.ObjectId.isValid(roomId)) {
        roomQuery._id = new mongoose.Types.ObjectId(roomId);
      } else {
        roomQuery.roomNumber = roomId;

      }
      
      console.log("hostelId", hostelId, "Room Id", roomId);
      const room = await Room.findOneAndUpdate(
        roomQuery,
        {
          $inc: { booking: 1 },
          $set: { updatedAt: new Date() },
        },
        { new: true, session }
      );

      if (!room) throw new Error("ROOM_NOT_AVAILABLE");

      // 💰 Check unpaid fee
     

      const totalAmount = room.price;

      // 💵 Create fee
      const [fee] = await Fee.create(
        [
          {
            studentId: user._id,
            roomId: room._id,
            roomNumber: room.roomNumber,
            amountDue: totalAmount,
            amountPaid: 0,
            duration: months,
            status: "PENDING",
            moveInDate: moveIn,
            dueDate,
            isMonthly: months > 1,
            hostelId: hostelId,
          },
        ],
        { session }
      );

      // 📑 Create booking
      const [booking] = await Booking.create(
        [
          {
            studentId: user._id,
            roomId: room._id,
            roomNumber: room.roomNumber,
            duration: months,
            moveInDate: moveIn,
            totalAmount,
            bookingDate: new Date(),
            status: "PENDING",
            hostelId: hostelId,
            endDate: bookingEndDate,
          },
        ],
        { session }
      );

      // 👤 Assign room to user
      user.roomId = room._id;
      user.roomNumber = room.roomNumber;
      user.moveInDate = moveIn;
      user.bookingId = booking._id;
      user.bookingEndDate = bookingEndDate;
      user.hostelId = hostelId;
      await user.save({ session });

      await session.commitTransaction();

      session.endSession();

      return res.status(200).json({
        message: "Room booked successfully",
        room,
        fee,
        booking,
        totalAmount,
        duration: months,
        moveInDate: moveIn,
        user: { id: user._id, name: user.name, role: user.role, roomId: user.roomId },
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      const errorMap = {
        USER_NOT_FOUND: [404, "User not found"],
        ALREADY_HAS_ROOM: [400, "Student already has a room"],
        ROOM_NOT_AVAILABLE: [400, "Room not available or already full"],
        FEE_EXISTS: [400, "Outstanding fee already exists for this student"],
      };

      const [status, message] =
        errorMap[err.message] || [500, "Internal server error"];
      console.error("Book room transaction error:", err);
      return res.status(status).json({ message });
    }
  } catch (error) {
    console.error("Book room error:", error);
    return res.status(401).json({ message: "Invalid or missing token" });
  }
};
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    const room = await Room.findById(booking.roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
   // room.currentOccupancy -= 1;
   const bookingUser = await Booking.findOne({
  studentId: booking.studentId,
  status: "CONFIRMED"
});

if (bookingUser) {
  console.log(bookingUser);
  return res.status(400).json({ message: "Cannot cancel booking after confirmation" });
}

    room.booking -= 1;
    await room.save();
    await Booking.findByIdAndUpdate(bookingId, { status: "CANCELLED" });
    await Fee.findOneAndDelete({ studentId: booking.studentId });
 
    await User.findByIdAndUpdate(booking.studentId, { roomId: null, roomNumber: null, moveInDate: null, bookingEndDate: null, hostelId: null });
    return res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.assignRoom = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { roomId, userId, feeAmount } = req.body;

    if (!roomId || !userId || !feeAmount) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Room ID and User ID and feeAmount are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(userId)) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Invalid Room ID or User ID' });
    }

    // Find room
    const room = await Room.findById(roomId).session(session);
    if (!room) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Room not found' });
    }

    // Find user (using lowercase 'user' to avoid conflict with imported User model)
    const user = await User.findById(userId).session(session);
    if (!user) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user already has a room
    if (user.roomId) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'User already has a room assigned' });
    }

    // Check if room is active
    if (room.isActive === false) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Room is inactive' });
    }

    // Check room capacity
    const occupancy = room.currentOccupancy ?? 0;
    if (occupancy >= room.maxCapacity) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Room is already at full capacity' });
    }

    // Check for existing unpaid fee


    // Increment room occupancy
    room.currentOccupancy = occupancy + 1;
    await room.save({ session });

    // Assign room to user
    user.roomId = room._id;
    await user.save({ session });

    // Create fee for the user
    const fee = await Fee.create(
      [
        {
          studentId: user._id,
          amountDue: room.price,
          amountPaid: 0,
          status: 'PENDING',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.json({
      message: 'Room assigned successfully',
      room,
      fee: fee[0],
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('Assign room error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
}

/* exports.uploadRoomImages = async (req, res) => {
  try {
    const { roomId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const newImages = req.files.map(file => ({
      url: `/uploads/rooms/${file.filename}`,
      uploadedAt: new Date()
    }));

    room.images.push(...newImages);
    await room.save();

    res.json({ message: 'Images uploaded successfully', images: room.images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}; */
exports.getBookingDetails = async (req, res) => {
  try {
    const token = getUserFromToken(
      req.headers.authorization?.split(" ")[1]
    );

    const user = await User.findOne({ email: token.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log(user);
    const booking = await Booking.find({ studentId: user._id })
      .populate("hostelId", "name address")
      .populate("roomId", "roomNumber type price");

    if (!booking) {
      return res.status(404).json({ message: "No booking found for this user" });
    }

    res.status(200).json({ booking });
  } catch (err) {
    console.error("Error fetching booking details:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};





/* exports.getRoomImages = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.images.length === 0) {
      return res.status(404).json({ message: 'No images found for this room' });
    }
    res.json({ images: room.images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
} */

exports.deleteRoomImage = async (req, res) => {
  try {
    const { roomId, imageId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const imageIndex = room.images.findIndex(img => img._id.toString() === imageId);
    if (imageIndex === -1) return res.status(404).json({ message: 'Image not found' });

    room.images.splice(imageIndex, 1);
    await room.save();

    res.json({ message: 'Image deleted successfully', images: room.images });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
exports.updateRoomImage = async (req, res) => {
  try {
    const { roomId, imageId } = req.params;
    const { url } = req.body;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    const image = room.images.id(imageId);
    if (!image) return res.status(404).json({ message: 'Image not found' });
    image.url = url;
    image.updatedAt = new Date();
    await room.save();
    res.json({ message: 'Image updated successfully', image });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.updateroomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { description, price, capacity, type, isActive } = req.body;
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    if (description) room.description = description.trim();
    if (price) room.price = Number(price);
    if (capacity) room.maxCapacity = Number(capacity);
    if (type) room.type = type.trim();
    const images = req.files.map(file => ({
      url: file.path,
      uploadedAt: new Date(),
    }));
    if (images && images.length > 0) {

      room.images = images;
    }
    if (isActive !== undefined) room.isActive = isActive;
    room.updatedAt = new Date();
    await room.save();
    res.json({ message: "Room details updated successfully", room });
  } catch (err) {
    console.error("Error updating room details:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
exports.leaveRoom = async (req, res) => {
  try {
    const token = getUserFromToken(
      req.headers.authorization?.split(" ")[1]
    );
    const user = await User.findOne({ email: token.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const bookings = await Booking.find({ studentId: user._id, status: "PENDING" });
    if (bookings.length !== 0) {
      return res.status(403).json({ message: "User has active bookings procced to cancel booking" });
    }
    const { roomId } = req.params;
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }
    room.currentOccupancy -= 1;
    await room.save();
    await User.findByIdAndUpdate(user._id, { roomId: null, roomNumber: null, moveInDate: null, bookingEndDate: null, hostelId: null });
    
    res.json({ message: "Room left successfully" });
  } catch (err) {
    console.error("Error leaving room:", err);
    res.status(500).json({ message: "Internal server error" });
  }
}
exports.getAllBookings = async (req, res) => {
  try {
    // 🔐 Verify token
    const token = verifyToken(req.headers.authorization?.split(" ")[1]);
    const useremail = token.email;

    // 👤 Find current user
    const user = await User.findOne({ email: useremail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.managedHostelId) {
      return res.status(403).json({ message: "You do not manage any hostel" });
    }

    // 📑 Get all bookings for this hostel
    const bookings = await Booking.find({ hostelId: user.managedHostelId })
      .populate("studentId", "name email photoUrl")
      .populate("roomId", "roomNumber type price")
      .sort({ bookingDate: -1 }); // most recent first

    res.json({
      message: "Bookings fetched successfully",
      bookings,
    });
  } catch (err) {
    console.error("Error getting bookings:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.confirmBookings = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { roomId, userId, feeAmount, bookingId } = req.body;
    
    if (!roomId || !userId || !feeAmount || !bookingId) {
      throw new Error('roomId, userId, feeAmount and bookingId are required');
    }

    if (
      !mongoose.Types.ObjectId.isValid(roomId) ||
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(bookingId)
    ) {
      throw new Error('Invalid ObjectId');
    }

    const room = await Room.findById(roomId).session(session);
    if (!room) throw new Error('Room not found');

    if (!room.isActive) throw new Error('Room is inactive');

    if ((room.currentOccupancy ?? 0) >= room.maxCapacity) {
      throw new Error('Room is already full');
    }

    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');

    if (user.roomId != roomId) {
      throw new Error('User already has another room assigned');
    }

    const booking = await Booking.findOne({
      _id: bookingId,
      studentId: userId,
      status: 'PENDING',
    }).session(session);

    if (!booking) throw new Error('Pending booking not found');

    const fee = await Fee.findOne({
      studentId: userId,
      
    }).session(session);

    if (!fee) throw new Error('Fee record not found');

    // ✅ Update room
    room.currentOccupancy += 1;
    await room.save({ session });

    // ✅ Assign room to user
  //  user.roomId = room._id;
    await user.save({ session });

    // ✅ Update fee
    fee.amountPaid = feeAmount;
    fee.status = 'PAID';
    await fee.save({ session });

    // ✅ Confirm booking
    booking.status = 'CONFIRMED';
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      message: 'Booking confirmed successfully',
      room,
      booking,
      fee,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    console.error('Confirm booking error:', err.message);

    res.status(400).json({
      message: err.message,
    });
  }
};

