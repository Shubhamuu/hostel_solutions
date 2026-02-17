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
  const session = await mongoose.startSession();

  try {
    const { pidx, fee_id } = req.body;

    if (!pidx || !fee_id) {
      return res.status(400).json({ message: "Missing pidx or fee_id" });
    }

    // ── 1. Khalti lookup OUTSIDE the transaction ──────────────────────
    // External HTTP calls must never sit inside a DB transaction —
    // they can't be rolled back and hold the session open too long.
    let khaltiData;
    try {
      const { data } = await axios.post(
        "https://dev.khalti.com/api/v2/epayment/lookup/",
        { pidx },
        {
          headers: {
            Authorization: `Key ${KHALTI_API_KEY.trim()}`,
            "Content-Type": "application/json",
          },
          timeout: 10_000, // don't hang forever
        }
      );
      khaltiData = data;
    } catch (axiosErr) {
      return res.status(502).json({
        message: "Failed to reach Khalti — please retry",
        error: axiosErr.response?.data || axiosErr.message,
      });
    }

    if (khaltiData.status !== "Completed") {
      return res.status(400).json({
        message: "Payment not completed",
        status: khaltiData.status,
      });
    }

    const amountPaid = khaltiData.total_amount / 100; // paisa → rupees

    // ── 2. All DB mutations in one atomic transaction ─────────────────
    let fee;

    await session.withTransaction(async () => {
      // ── Fee ──────────────────────────────────────────────────────────
      fee = await Fee.findById(fee_id).session(session);
      if (!fee) {
        const err = new Error("Fee record not found");
        err.statusCode = 404;
        throw err;
      }

      // Idempotency guard — safe to call twice without double-crediting
      if (fee.KhaltipaymentStatus === "PAID") {
        const err = new Error("ALREADY_PAID");
        err.statusCode = 200;
        err.fee = fee;
        throw err;
      }

      fee.amountPaid   = Math.min(fee.amountPaid + amountPaid, fee.amountDue);
      fee.paymentReference  = "khalti";
      fee.status            = fee.amountPaid >= fee.amountDue ? "PAID" : "PARTIAL";
      fee.KhaltipaymentStatus = "PAID";
      fee.paidAt            = new Date();
      await fee.save({ session });

      // ── Booking ──────────────────────────────────────────────────────
      // findOneAndUpdate is atomic; no separate save() needed
      const booking = await Booking.findOneAndUpdate(
        { studentId: fee.studentId, status: "PENDING" },
        { $set: { status: "CONFIRMED" } },
        { new: true, session }
      );

      if (booking) {
        // Decrement available slot, increment occupancy — one round-trip
        await Room.findByIdAndUpdate(
          booking.roomId,
          { $inc: { booking: -1, currentOccupancy: 1 } },
          { session }
        );
      }

      // ── User ─────────────────────────────────────────────────────────
      await User.findByIdAndUpdate(
        fee.studentId,
        { $set: { isVerified: true } },
        { session }
      );
    });

    return res.status(200).json({
      message: "✅ Payment verified successfully",
      fee,
      khalti_data: khaltiData,
    });

  } catch (err) {
    // Intentional early-exit errors thrown inside the transaction
    if (err.statusCode === 200 && err.message === "ALREADY_PAID") {
      return res.status(200).json({ message: "Payment already verified", fee: err.fee });
    }
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }

    console.error("❌ Khalti Verify Error:", err);
    return res.status(500).json({
      message: "Khalti payment verification failed",
      error: err.message,
    });
  } finally {
    session.endSession();
  }
};

