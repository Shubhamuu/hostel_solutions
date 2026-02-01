const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  roomNumber: { type: String, required: true },
  duration: { type: Number, required: true },
  moveInDate: { type: Date, required: true },
  bookingDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  totalAmount: { type: Number, required: true },
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: "Hostel", required: true },
  status: { type: String, enum: ["CONFIRMED","CANCELLED","EXPIRED","PENDING"], default: "PENDING" },
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
