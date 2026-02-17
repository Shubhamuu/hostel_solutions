const Fee = require('../models/Fee');
const User = require('../models/User');
const Hostel = require('../models/hostel');
const Disbursement = require('../models/Disbursement');
const Income = require("../models/Income");
const mongoose = require('mongoose');
const { verifyToken } = require('../utils/jwtauth');
const { sendDisbursementEmail } = require('../utils/sendotp');

const SERVICE_FEE_RATE = 0.001; // 0.1%

// SuperAdmin: Create disbursement for a hostel's paid Khalti fees
exports.createDisbursement = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { hostelId } = req.body;

        if (!hostelId || !mongoose.Types.ObjectId.isValid(hostelId)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ success: false, message: 'Valid hostel ID is required' });
        }

        // Find hostel with admin details
        const hostel = await Hostel.findById(hostelId).populate('adminId').session(session);
        if (!hostel) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ success: false, message: 'Hostel not found' });
        }

        // Find all PAID fees with khalti payment that haven't been disbursed yet
        const existingDisbursements = await Disbursement.find({
            hostelId,
            status: { $in: ['PENDING', 'COMPLETED'] }
        }).session(session);

        const alreadyDisbursedFeeIds = existingDisbursements.reduce((ids, d) => {
            return ids.concat(d.feeIds.map(id => id.toString()));
        }, []);

        const paidFees = await Fee.find({
            hostelId,
            status: 'PAID',
            paymentReference: 'khalti',
            _id: { $nin: alreadyDisbursedFeeIds }
        }).session(session);

        if (paidFees.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
                success: false,
                message: 'No undisbursed Khalti-paid fees found for this hostel'
            });
        }

        // Calculate amounts
        const totalCollected = paidFees.reduce((sum, fee) => sum + fee.amountPaid, 0);
        const serviceFee = Math.round(totalCollected * SERVICE_FEE_RATE * 100) / 100;
        const amountDisbursed = Math.round((totalCollected - serviceFee) * 100) / 100;

        // Create disbursement record
        const [disbursement] = await Disbursement.create([{
            hostelId,
            adminId: hostel.adminId._id,
            totalCollected,
            serviceFee,
            amountDisbursed,
            feeIds: paidFees.map(f => f._id),
            status: 'COMPLETED',
            requestedBy: 'SUPERADMIN',
            processedAt: new Date()
        }], { session });

        // Record Income for service fee
        if (serviceFee > 0) {
            const Income = require('../models/Income');
            await Income.create([{
                amount: serviceFee,
                type: 'SERVICE_FEE',
                disbursementId: disbursement._id,
                hostelId: hostelId,
                description: `Service fee from disbursement for ${hostel.name}`
            }], { session });
        }

        await session.commitTransaction();
        session.endSession();

        // Send email to admin (outside transaction)
        if (hostel.adminId?.email) {
            sendDisbursementEmail(
                hostel.adminId.email,
                hostel.adminId.name,
                hostel.name,
                totalCollected,
                serviceFee,
                amountDisbursed,
                paidFees.length
            ).catch(err => console.error('Failed to send disbursement email:', err));
        }

        res.status(201).json({
            success: true,
            message: 'Payment disbursed successfully',
            data: {
                disbursement,
                summary: {
                    totalCollected,
                    serviceFee,
                    amountDisbursed,
                    feesCount: paidFees.length,
                    hostelName: hostel.name,
                    adminEmail: hostel.adminId?.email
                }
            }
        });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('Create Disbursement Error:', err);
        res.status(500).json({ success: false, message: 'Failed to create disbursement', error: err.message });
    }
};

// SuperAdmin: Get all disbursements
exports.getAllDisbursements = async (req, res) => {
    try {
        const disbursements = await Disbursement.find()
            .populate('hostelId', 'name address')
            .populate('adminId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: disbursements });
    } catch (err) {
        console.error('Get All Disbursements Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Admin: Get disbursements for their hostel
exports.getDisbursementsForAdmin = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const userData = verifyToken(token);
        const user = await User.findOne({ email: userData.email });

        if (!user || !user.managedHostelId) {
            return res.status(403).json({ success: false, message: 'No hostel managed' });
        }

        const disbursements = await Disbursement.find({ hostelId: user.managedHostelId })
            .populate('hostelId', 'name address')
            .sort({ createdAt: -1 });

        // Calculate summary
        const totalReceived = disbursements
            .filter(d => d.status === 'COMPLETED')
            .reduce((sum, d) => sum + d.amountDisbursed, 0);

        const totalPending = disbursements
            .filter(d => d.status === 'PENDING')
            .reduce((sum, d) => sum + d.amountDisbursed, 0);

        const totalServiceFees = disbursements
            .filter(d => d.status === 'COMPLETED')
            .reduce((sum, d) => sum + d.serviceFee, 0);

        res.status(200).json({
            success: true,
            data: disbursements,
            summary: {
                totalReceived: Math.round(totalReceived * 100) / 100,
                totalPending: Math.round(totalPending * 100) / 100,
                totalServiceFees: Math.round(totalServiceFees * 100) / 100,
                totalDisbursements: disbursements.length
            }
        });
    } catch (err) {
        console.error('Get Admin Disbursements Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// Admin: Request payment disbursement
exports.requestDisbursement = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const userData = verifyToken(token);
        const user = await User.findOne({ email: userData.email });

        if (!user || !user.managedHostelId) {
            return res.status(403).json({ success: false, message: 'No hostel managed' });
        }

        const hostelId = user.managedHostelId;

        // Check for existing pending request
        const existingPending = await Disbursement.findOne({
            hostelId,
            status: 'PENDING',
            requestedBy: 'ADMIN'
        });

        if (existingPending) {
            return res.status(400).json({
                success: false,
                message: 'You already have a pending disbursement request'
            });
        }

        // Find undisbursed Khalti-paid fees
        const existingDisbursements = await Disbursement.find({
            hostelId,
            status: { $in: ['PENDING', 'COMPLETED'] }
        });

        const alreadyDisbursedFeeIds = existingDisbursements.reduce((ids, d) => {
            return ids.concat(d.feeIds.map(id => id.toString()));
        }, []);

        const paidFees = await Fee.find({
            hostelId,
            status: 'PAID',
            paymentReference: 'khalti',
            _id: { $nin: alreadyDisbursedFeeIds }
        });

        if (paidFees.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No undisbursed Khalti-paid fees to request payment for'
            });
        }

        const totalCollected = paidFees.reduce((sum, fee) => sum + fee.amountPaid, 0);
        const serviceFee = Math.round(totalCollected * SERVICE_FEE_RATE * 100) / 100;
        const amountDisbursed = Math.round((totalCollected - serviceFee) * 100) / 100;

        const disbursement = await Disbursement.create({
            hostelId,
            adminId: user._id,
            totalCollected,
            serviceFee,
            amountDisbursed,
            feeIds: paidFees.map(f => f._id),
            status: 'PENDING',
            requestedBy: 'ADMIN'
        });

        res.status(201).json({
            success: true,
            message: 'Disbursement request submitted successfully',
            data: disbursement
        });
    } catch (err) {
        console.error('Request Disbursement Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// SuperAdmin: Update disbursement status (approve/reject)
exports.updateDisbursementStatus = async (req, res) => {
    try {
        const { disbursementId, status, reason } = req.body;

        if (!disbursementId || !status) {
            return res.status(400).json({ success: false, message: 'Disbursement ID and status required' });
        }

        if (!['COMPLETED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be COMPLETED or REJECTED' });
        }

        if (status === 'REJECTED' && !reason) {
            return res.status(400).json({ success: false, message: 'Reason required for rejection' });
        }

        const disbursement = await Disbursement.findById(disbursementId)
            .populate('hostelId', 'name')
            .populate('adminId', 'name email');

        if (!disbursement) {
            return res.status(404).json({ success: false, message: 'Disbursement not found' });
        }

        if (disbursement.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: 'Only pending disbursements can be updated' });
        }

        disbursement.status = status;
        disbursement.processedAt = new Date();
        disbursement.updatedAt = new Date();
        if (reason) disbursement.reason = reason;

        await disbursement.save();

        if (status === 'COMPLETED' && disbursement.serviceFee > 0) {
            
            // Check if income already exists for this disbursement to prevent duplicates
            const existingIncome = await Income.findOne({ disbursementId: disbursement._id });

            if (!existingIncome) {
                await Income.create({
                    amount: disbursement.serviceFee,
                    type: 'SERVICE_FEE',
                    disbursementId: disbursement._id,
                    hostelId: disbursement.hostelId._id || disbursement.hostelId,
                    description: `Service fee from approved disbursement for ${disbursement.hostelId.name || 'hostel'}`
                });
            }
        }

        if (status === 'COMPLETED' && disbursement.serviceFee > 0) {
           
            // Check if income already exists for this disbursement to prevent duplicates
            const existingIncome = await Income.findOne({ disbursementId: disbursement._id });

            if (!existingIncome) {
                await Income.create({
                    amount: disbursement.serviceFee,
                    type: 'SERVICE_FEE',
                    disbursementId: disbursement._id,
                    hostelId: disbursement.hostelId._id || disbursement.hostelId,
                    description: `Service fee from approved disbursement for ${disbursement.hostelId.name || 'hostel'}`
                });
            }
        }

        // Send email notification
        if (disbursement.adminId?.email && status === 'COMPLETED') {
            sendDisbursementEmail(
                disbursement.adminId.email,
                disbursement.adminId.name,
                disbursement.hostelId.name,
                disbursement.totalCollected,
                disbursement.serviceFee,
                disbursement.amountDisbursed,
                disbursement.feeIds.length
            ).catch(err => console.error('Failed to send disbursement email:', err));
        }

        res.status(200).json({
            success: true,
            message: `Disbursement ${status.toLowerCase()} successfully`,
            data: disbursement
        });
    } catch (err) {
        console.error('Update Disbursement Status Error:', err);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
