const mongoose = require('mongoose');
const { Schema } = mongoose;

const DisbursementSchema = new Schema({
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    totalCollected: { type: Number, required: true, min: 0 },
    serviceFee: { type: Number, required: true, min: 0 },
    amountDisbursed: { type: Number, required: true, min: 0 },
    feeIds: [{ type: Schema.Types.ObjectId, ref: 'Fee' }],
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'REJECTED'],
        default: 'PENDING'
    },
    requestedBy: {
        type: String,
        enum: ['ADMIN', 'SUPERADMIN'],
        required: true
    },
    processedAt: { type: Date },
    reason: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Disbursement', DisbursementSchema);
