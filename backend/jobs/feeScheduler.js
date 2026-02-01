const cron = require("node-cron");
const Fee = require("../models/Fee");
const User = require("../models/User");
const Room = require("../models/Room");

const scheduleMonthlyFee = () => {
  try {
  cron.schedule("0 0 1 * *", async () => {
    console.log("🕛 Running monthly fee generator...");

    
      const students = await User.find({
        role: "STUDENT",
        isVerified: true,
        roomId: { $ne: null },
      });

      for (const student of students) {
        console.log(`Processing fee for student: ${student.name}`);
        const room = await Room.findById(student.roomId);
        if (!room) continue;

        const now = new Date();
        const dueDate = new Date(now.getFullYear(), now.getMonth(), 15);

        // Get latest fee
        const latestFee = await Fee.findOne({ studentId: student._id })
          .sort({ dueDate: -1 });
        console.log(`Latest fee for ${student.name}:`, latestFee);
        let carriedDue = 0;
        if (latestFee && latestFee.status !== "PAID") {
          carriedDue = latestFee.amountDue - latestFee.amountPaid;
        }

        const amountDue = room.price + carriedDue;

        // Prevent duplicate fee for same month
        const existingFee = await Fee.findOne({
          studentId: student._id,
          dueDate,
        });

        if (existingFee) {
          existingFee.amountDue = amountDue;
          existingFee.updatedAt = now;
          await existingFee.save();
          continue;
        }

        await Fee.create({
          studentId: student._id,
          roomId: room._id,
          amountDue,
          amountPaid: 0,
          status: "PENDING",
          dueDate,
        });

        console.log(`✅ Fee generated for ${student.name}`);
      }
    
  })
}catch (error) {
      console.error("❌ Monthly fee generation failed:", error);
    };
  };
module.exports = { scheduleMonthlyFee };
