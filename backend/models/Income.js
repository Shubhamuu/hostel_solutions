const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    type: {
        type: String,
        enum: ['SERVICE_FEE'],
        default: 'SERVICE_FEE'
    },
    disbursementId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Disbursement',
        required: true
    },
    hostelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hostel',
        required: true
    },
    description: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Income', incomeSchema);
