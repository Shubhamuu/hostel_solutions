const mongoose = require('mongoose');
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },

  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'ADMIN', 'STUDENT'],
    required: true
  },


  // Admin approval system
  approvalStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Hostel managed by admin
  managedHostelId: {
    type: Schema.Types.ObjectId,
    ref: 'Hostel',
    default: null
  },
  hostelname: { type: String, default: null },
  // Verification documents (Cloudinary)
  verificationDocuments: [
    {
      type: {
        type: String, // PAN, REGISTRATION, LICENSE
        required: true
      },
      url: {
        type: String, // Cloudinary URL
        required: true
      },
      
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],

  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date, default: null },
  photoUrl: { type: String },
// STUDENT
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', default: null },
  hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', default: null },

  bookingHistory: [
    {
      bookingId: { type: Schema.Types.ObjectId, ref: "Booking" },
      roomNumber: String,
      duration: Number,
      moveInDate: Date,
      moveOutDate: Date,
      status: {
        type: String,
        enum: ["CONFIRMED", "COMPLETED", "CANCELLED"],
      },
    },
  ],

  emailVerificationCode: { type: String, default: null },
  emailVerificationExpires: { type: Date, default: null },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
