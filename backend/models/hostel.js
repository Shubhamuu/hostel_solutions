const mongoose = require('mongoose');
const { Schema } = mongoose;

const HostelSchema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },

  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  images: [
    {
      url: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  location: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number] } // [longitude, latitude]
  },

// Create a 2dsphere index to enable proximity searches

  isActive: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
HostelSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('Hostel', HostelSchema);
