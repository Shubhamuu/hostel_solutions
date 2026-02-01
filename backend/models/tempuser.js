const mongoose = require('mongoose');

const tempUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  passwordHash: {
    type: String,
    required: true,
  },

  verificationCode: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ['STUDENT', 'ADMIN'],
    default: 'STUDENT',
  },

  // Hostel details (only relevant if role = ADMIN)
  hostelName: {
    type: String,
    trim: true,
  },

  hostelLocation: {
    type: String,
    trim: true,
  },

  // Admin verification documents (Cloudinary URLs)
  verificationDocuments: [
    {
      type: {
        type: String, // PAN, REGISTRATION, LICENSE
        required: true,
      },
      url: {
        type: String, // Cloudinary URL
        required: true,
      },
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600, // Auto-delete after 1 hour
  },

});

module.exports = mongoose.model('TempUser', tempUserSchema);
