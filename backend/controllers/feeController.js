const Fee = require("../models/Fee");
const User = require("../models/User");
const { verifyToken } = require("../utils/jwtauth");
const mongoose = require("mongoose");

// View all fee records (Admin only)
exports.viewFeeAdmin = async (req, res) => {

  try {
    const token = req.headers.authorization?.split(" ")[1];
    const users = verifyToken(token);
    const userData = await User.findOne({ email: users.email });

    const fees = await Fee.find({ hostelId: userData.managedHostelId })
      .populate("studentId", "username email") // Populate with student info
      .populate("seaterTypeId", "type price");

    return res.status(200).json(fees);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// View fee records for logged-in student only
exports.viewFeeByStudent = async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const users = verifyToken(token);
  const userData = await User.findOne({ email: users.email });
  try {

    const fees = await Fee.find({ studentId: userData._id })

    //console.log("Fetched fees:", fees);
    return res.status(200).json(fees);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update a student's fee record (Admin only)
exports.updateFee = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const userData = verifyToken(token);

    if (!userData) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    const {
      feeId,
      amountPaid,
      studentId: studentIdFromBody, // only required for admins
    } = req.body;
    paymentReference = "admin-update";

    // Validate feeId
    if (!mongoose.Types.ObjectId.isValid(feeId)) {
      return res.status(400).json({ message: "Invalid feeId" });
    }

    // Determine the correct studentId
    const studentId = userData.role === "STUDENT" ? userData.id : studentIdFromBody;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "Invalid studentId" });
    }

    // Find the fee record and ensure it belongs to the student
    const fee = await Fee.findOne({ _id: feeId, studentId });
    if (!fee) {
      return res.status(404).json({ message: "Fee record not found or access denied" });
    }

    // Only allow STUDENT to update their own amountPaid and nothing else
    if (userData.role === "STUDENT") {
      if (amountPaid !== undefined) fee.amountPaid = amountPaid;
      // Optionally: auto-update status based on payment
      if (fee.amountPaid >= fee.amountDue) {
        fee.status = "PAID";
        fee.paidAt = new Date();
      } else if (fee.amountPaid > 0) {
        fee.status = "PARTIAL";
      }
      fee.updatedAt = new Date();
    }

    // Allow ADMIN full control
    if (userData.role === "ADMIN") {
      if (amountPaid !== undefined) fee.amountPaid = amountPaid;
      //if (status) fee.status = status;
      if (paymentReference) fee.paymentReference = paymentReference;
      fee.status = "PAID";
      // if (paidAt) fee.paidAt = new Date(paidAt);
      //fee.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
    }

    await fee.save();
    return res.status(200).json({ message: "Fee updated successfully", fee });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// SuperAdmin: Get all fees grouped by hostel
exports.getAllFeesForSuperAdmin = async (req, res) => {
  try {
    const Hostel = require('../models/hostel');
    const Disbursement = require('../models/Disbursement');

    // Get all hostels
    const hostels = await Hostel.find().populate('adminId', 'name email').lean();

    // Get all fees
    const allFees = await Fee.find()
      .populate('studentId', 'name email')
      .populate('hostelId', 'name')
      .lean();

    // Get existing disbursements to identify already-disbursed fees
    const disbursements = await Disbursement.find({
      status: { $in: ['PENDING', 'COMPLETED'] }
    }).lean();

    const disbursedFeeIds = new Set();
    disbursements.forEach(d => {
      d.feeIds.forEach(id => disbursedFeeIds.add(id.toString()));
    });

    // Group fees by hostel
    const hostelFeeMap = {};

    allFees.forEach(fee => {
      const hostelId = fee.hostelId?._id?.toString() || 'unknown';
      if (!hostelFeeMap[hostelId]) {
        hostelFeeMap[hostelId] = {
          fees: [],
          totalCollected: 0,
          totalPending: 0,
          khaltiPaidCount: 0,
          khaltiPaidTotal: 0,
          undisbursedKhaltiTotal: 0,
          undisbursedKhaltiCount: 0
        };
      }

      hostelFeeMap[hostelId].fees.push(fee);

      const isDisbursed = disbursedFeeIds.has(fee._id.toString());
      fee.isDisbursed = isDisbursed;

      if (fee.status === 'PAID') {
        hostelFeeMap[hostelId].totalCollected += fee.amountPaid;
      } else {
        hostelFeeMap[hostelId].totalPending += fee.amountDue - fee.amountPaid;
      }

      if (fee.paymentReference && fee.paymentReference.includes('khalti') && fee.status === 'PAID') {
        hostelFeeMap[hostelId].khaltiPaidCount++;
        hostelFeeMap[hostelId].khaltiPaidTotal += fee.amountPaid;

        if (!isDisbursed) {
          hostelFeeMap[hostelId].undisbursedKhaltiTotal += fee.amountPaid;
          hostelFeeMap[hostelId].undisbursedKhaltiCount++;
        }
      }
    });

    // Build response grouped by hostel
    const grouped = hostels.map(hostel => {
      const hId = hostel._id.toString();
      const feeData = hostelFeeMap[hId] || {
        fees: [], totalCollected: 0, totalPending: 0,
        khaltiPaidCount: 0, khaltiPaidTotal: 0,
        undisbursedKhaltiTotal: 0, undisbursedKhaltiCount: 0
      };

      return {
        hostel: {
          _id: hostel._id,
          name: hostel.name,
          address: hostel.address,
          admin: hostel.adminId
        },
        fees: feeData.fees,
        summary: {
          totalCollected: Math.round(feeData.totalCollected * 100) / 100,
          totalPending: Math.round(feeData.totalPending * 100) / 100,
          totalFees: feeData.fees.length,
          khaltiPaidCount: feeData.khaltiPaidCount,
          khaltiPaidTotal: Math.round(feeData.khaltiPaidTotal * 100) / 100,
          undisbursedKhaltiTotal: Math.round(feeData.undisbursedKhaltiTotal * 100) / 100,
          undisbursedKhaltiCount: feeData.undisbursedKhaltiCount
        }
      };
    });

    res.status(200).json({
      success: true,
      data: grouped
    });

  } catch (err) {
    console.error('Get All Fees For SuperAdmin Error:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: err.message });
  }
};
