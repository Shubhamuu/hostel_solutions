const mongoose = require('mongoose');
const { Schema } = mongoose;

const RoomSchema = new Schema({
  roomNumber: { type: String, required: true },

  hostelId: {
    type: Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true
  },

  price: { type: Number, required: true },
  currentOccupancy: { type: Number, default: 0 },
  booking: { type: Number, default: 0 },

  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  },

  maxCapacity: { type: Number, required: true },
  type: { type: String, required: true },
  description: { type: String, default: '' },
  isActive: { type: Boolean, default: true },

  images: [
    {
      url: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }
  ],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', RoomSchema);
