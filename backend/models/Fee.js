const mongoose = require('mongoose');
const { Schema } = mongoose;

const FeeSchema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  seaterTypeId: { type: Schema.Types.ObjectId, ref: 'SeaterType',},
  amountDue: { type: Number, required: true, min: 0 },
  hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true },
  amountPaid: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['PENDING', 'PAID', 'PARTIAL'], required: true },
  dueDate: { type: Date, required: true },
    paymentReference: {
    type: [String],
    default: []
  },
   bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  },

  khaltiPidx: { type: String },
KhaltipaymentStatus: { type: String, enum: ["INITIATED", "PAID"], default: "INITIATED" },
  amount: { type: Number, min: 0 },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Fee', FeeSchema);
