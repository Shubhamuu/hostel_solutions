const axios = require('axios');
const constants = require('../constants/getenv');
const mongoose = require("mongoose");
const Fee = require('../models/Fee');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { verifyToken } = require('../utils/jwtauth');

const KHALTI_API_KEY = constants.KHALTI_API_KEY;

exports.initiateKhaltiFeePayment = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    const user = verifyToken(token);

    // Safer user fetch
    const userData = await User.findById(user.id);
    if (!userData) {
      return res.status(404).json({ message: "User not found" });
    }

    const { feeId } = req.body;

    const fee = await Fee.findOne({ _id: feeId });
    if (!fee) {
      return res.status(404).json({ message: "Fee not found" });
    }

    // Calculate amount in paisa
    const amountInPaisa = Math.round((fee.amountDue - fee.amountPaid) * 100);

    if (amountInPaisa <= 0) {
      return res.status(400).json({ message: "Fee already paid" });
    }

    // Create unique Purchase Order ID
    const purchaseOrderId = `FEE_${feeId}_${Date.now()}`;

    const payload = {
      return_url: `${process.env.FRONTEND_URL}/payment/success`,
      website_url: process.env.FRONTEND_URL,
      amount: amountInPaisa,
      purchase_order_id: purchaseOrderId,
      purchase_order_name: "Hostel Fee Payment",
      customer_info: {
        name: userData.name || "Student",
        email: userData.email
      }
    };

    console.log("Khalti Initiate Payload:", payload);

    const response = await axios.post(
      "https://dev.khalti.com/api/v2/epayment/initiate/",
      payload,
      {
        headers: {
          Authorization: `Key ${KHALTI_API_KEY.trim()}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Khalti Payment Initiated:", response.data);
    // after successful initiate API call
    const khaltiResponse = response.data;

    await Fee.findByIdAndUpdate(
      feeId,
      {
        khaltiPidx: khaltiResponse.pidx,
        KhaltipaymentStatus: "INITIATED"
      },
      { new: true }
    );

    return res.json({
      pidx: response.data.pidx,
      payment_url: response.data.payment_url,
      expires_in: response.data.expires_in
    });

  } catch (err) {
    console.error("Khalti Init Error:", err.response?.data || err.message);
    const detail = err.response?.data?.detail || err.message;
    return res.status(500).json({
      message: `Payment initiation failed: ${JSON.stringify(detail)}`
    });
  }
};

exports.verifyKhaltiFeePayment = async (req, res) => {
  try {
    console.log("🔍 [Khalti Verify] Body:", req.body);

    const { pidx, fee_id, transactionId } = req.body;

    if (!pidx) {
      return res.status(400).json({ message: "Missing pidx" });
    }

    // 1️⃣ Lookup payment status from Khalti
    const khaltiResponse = await axios.post(
      "https://dev.khalti.com/api/v2/epayment/lookup/",
      { pidx },
      {
        headers: {
          Authorization: `Key ${KHALTI_API_KEY.trim()}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (khaltiResponse.data.status !== "Completed") {
      return res.status(400).json({
        message: `Payment not completed`,
        status: khaltiResponse.data.status,
      });
    }

    // 2️⃣ Find Fee using saved pidx
    const fee = await Fee.findById(fee_id);
    console.log("🔍 [Fee Found]:", fee);
    if (!fee) {
      return res.status(404).json({
        message: "Fee record not found for this payment",
      });
    }

    // 3️⃣ Prevent double verification
    if (fee.KhaltipaymentStatus === "PAID") {
      return res.status(200).json({
        message: "Payment already verified",
        fee,
      });
    }

    // 4️⃣ Update fee
    const amountPaid = khaltiResponse.data.total_amount / 100;

    fee.amountPaid = Math.min(
      fee.amountPaid + amountPaid,
      fee.amountDue
    );

    fee.status = fee.amountPaid >= fee.amountDue ? "PAID" : "PARTIAL";
    fee.KhaltipaymentStatus = "PAID";
    fee.paidAt = new Date();
    fee.updatedAt = new Date();

    await fee.save();

    // 5️⃣ Update booking status


    const booking = await Booking.findOne({
      studentId: fee.studentId,
      status: "PENDING"
    });

    if (booking) {
      booking.status = "CONFIRMED";
      await booking.save();

      await Room.findByIdAndUpdate(
        booking.roomId,
        { $inc: { booking: -1, currentOccupancy: 1 } }
      );
    }


    // 6️⃣ Mark user as verified
    await User.findByIdAndUpdate(
      fee.studentId,
      { $set: { isVerified: true } },
      { new: true }
    );

    return res.status(200).json({
      message: "✅ Payment verified successfully",
      fee,
      khalti_data: khaltiResponse.data,
    });

  } catch (err) {
    console.error("❌ Khalti Verify Error:", err.response?.data || err.message);

    return res.status(500).json({
      message: "Khalti payment verification failed",
      error: err.response?.data || err.message,
    });
  }
};

