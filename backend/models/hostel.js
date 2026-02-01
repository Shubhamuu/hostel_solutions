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
      url: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  isActive: { type: Boolean, default: false },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Hostel', HostelSchema);
