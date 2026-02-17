const User = require('../models/User');
const TempUser = require('../models/tempuser');
const Hostel = require('../models/hostel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { sendVerificationEmail, successRegistration, codeExpiry } = require('../utils/sendotp');
const generateCode = require('../utils/generatecode');
const { generateTokens, verifyRefreshToken, removeRefreshToken, generateaccessToken } = require('../utils/jwtauth');
const getUserFromToken = require('../utils/getuserFromToken');

exports.refreshToken = async (req, res) => {
  //console.log(req.headers)
  const refreshToken = req?.headers?.cookie?.split('=')[1] || req.headers?.authorization?.split(' ')[1];
 //console.log("Refresh token from cookie/header:", refreshToken);
 //console.log("Headers:", req.headers);
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }
  //console.log("Received refresh token:", refreshToken);

  const userData = await verifyRefreshToken(refreshToken);
  console.log("User data from refresh token:", userData);
  if (!userData) {
    
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
  
  const tokens = generateaccessToken(userData); // new access token
  res.status(200).json(tokens);
};

exports.register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      hostelName,
      hostelLocation,
    } = req.body;
    const verificationDocuments = req.files
      ? req.files.map(file => ({
        type: req.body.documentType || 'UNKNOWN',
        url: file.path,
        public_id: file.filename,
      }))
      : [];
    const normalizedRole = role?.toUpperCase();

    if (!['STUDENT', 'ADMIN'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role' });
    }



    // ✅ Check existing verified user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // ✅ Admin required fields validation
    if (
      normalizedRole === 'ADMIN' &&
      (!hostelName || !hostelLocation)
    ) {
      return res.status(400).json({
        message: 'Hostel name and location are required for admin registration',
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationCode = generateCode();

    let tempUser = await TempUser.findOne({ email });

    // =====================================
    // UPDATE EXISTING TEMP USER (RESEND OTP)
    // =====================================
    if (tempUser) {

      tempUser.name = name;
      tempUser.passwordHash = hashedPassword;
      tempUser.verificationCode = verificationCode;
      tempUser.role = normalizedRole;
      tempUser.createdAt = Date.now(); // reset TTL

      if (normalizedRole === 'ADMIN') {
        tempUser.hostelName = hostelName;
        tempUser.hostelLocation = hostelLocation;
        // ✅ Prepare verification documents safely

        // ✅ Only overwrite docs if new ones uploaded
        if (verificationDocuments.length > 0) {
          tempUser.verificationDocuments = verificationDocuments;
        }
      }

      await tempUser.save();
      await sendVerificationEmail(email, name, verificationCode);

      return res.status(200).json({
        success: true,
        message: 'New verification code sent to your email.',
      });
    }

    // ===============================
    // CREATE NEW TEMP USER
    // ===============================
    tempUser = new TempUser({
      name,
      email,
      passwordHash: hashedPassword,
      verificationCode,
      role: normalizedRole,
      ...(normalizedRole === 'ADMIN' && {
        hostelName,
        hostelLocation,
        verificationDocuments,
      }),
    });

    await tempUser.save();
    await sendVerificationEmail(email, name, verificationCode);

    return res.status(200).json({
      success: true,
      message: 'Verification code sent. Please check your email.',
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
  }
};



exports.verifyOtp = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    let responsePayload;

    await session.withTransaction(async () => {
      // ── Isolation: all reads inside the transaction ───────────────
      const tempUser = await TempUser.findOne({ email }).session(session);

      if (!tempUser) {
        const err = new Error('Invalid email');
        err.statusCode = 400;
        throw err;
      }

      if (tempUser.verificationCode !== verificationCode) {
        const err = new Error('Invalid verification code');
        err.statusCode = 400;
        throw err;
      }

      // ── Consistency: prevent duplicate verified users ─────────────
      const existingUser = await User.findOne({ email }).session(session);
      if (existingUser) {
        const err = new Error('User already verified');
        err.statusCode = 400;
        throw err;
      }

      // ── CREATE USER ───────────────────────────────────────────────
      const user = new User({
        name: tempUser.name,
        email: tempUser.email,
        passwordHash: tempUser.passwordHash,
        role: tempUser.role,
        isApproved: tempUser.role !== 'ADMIN',
        isVerified: true,
        verifiedAt: new Date(),
        verificationDocuments: tempUser.verificationDocuments || [],
      });

      await user.save({ session });

      // ── CREATE / LINK HOSTEL (ADMIN ONLY) ─────────────────────────
      if (tempUser.role === 'ADMIN') {
        let hostel = await Hostel.findOne({ name: tempUser.hostelName }).session(session);

        if (!hostel) {
          hostel = new Hostel({
            name: tempUser.hostelName,
            address: tempUser.hostelLocation,
            adminId: user._id,
            isActive: false,
          });
          await hostel.save({ session });
        }

        // Link hostel → admin atomically in the same tx
        user.managedHostelId = hostel._id;
        user.hostelname = hostel.name;
        await user.save({ session });
      }

      // ── CLEANUP TEMP USER (inside tx so it's all-or-nothing) ──────
      await TempUser.deleteOne({ _id: tempUser._id }).session(session);

      // ── SUCCESS EMAIL (inside tx — rolls back writes if this fails) 
      await successRegistration(user.name, user.email);

      responsePayload = {
        status: 201,
        body: {
          success: true,
          message:
            tempUser.role === 'ADMIN'
              ? 'Registration successful. Awaiting super admin approval.'
              : 'Registration successful. You can now log in.',
        },
      };
    });

    return res.status(responsePayload.status).json(responsePayload.body);

  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    console.error('[verifyOtp]', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  } finally {
    session.endSession();
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });


    const tokens = await generateTokens({ _id: user._id, name: user.name, email: user.email, role: user.role });

    // console.log("Generated tokens:", tokens);
    res.cookie("refreshToken", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",             
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    if (user.role === 'ADMIN') {
      res.json({ tokens, user: { id: user._id, name: user.name, role: user.role, managedHostelId: user.managedHostelId, approvalStatus: user.approvalStatus } });
    } else {
      res.json({ tokens, user: { id: user._id, name: user.name, role: user.role, roomId: user.roomId } });
    }
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user || user.verification_code !== code) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    user.is_verified = true;
    user.verified_at = new Date();
    user.verification_code = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const resetCode = crypto.randomBytes(4).toString('hex');
    user.emailVerificationCode = resetCode;
    user.emailVerificationExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
    await user.save();

    // TODO: Send reset code to email
    console.log(`Reset code (send to email): ${resetCode}`);

    res.json({ message: 'Reset code sent to email' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await User.findOne({ email });
    console.log("User found for password reset:", user);
    if (!user || user.emailVerificationCode !== code) {
      return res.status(400).json({ message: 'Invalid reset code' });
    }
    if (user.emailVerificationExpires < Date.now()) {
      return res.status(400).json({ message: 'Reset code has expired' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.reset_code = undefined;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
exports.logout = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) await removeRefreshToken(refreshToken);

  res.clearCookie("refreshToken", { path: "/" });
  return res.json({ message: "Logged out successfully" });
}
exports.changePassword = async (req, res) => {
  const { newPassword, oldPassword } = req.body;

  if (!newPassword || !oldPassword) {
    return res.status(400).json({ message: "Both old and new passwords are required" });
  }

  try {
    // Get token from headers
    const token = req.headers.authorization?.split(" ")[1]; // Bearer <token>
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    // Decode user info from token
    const userinfo = getUserFromToken(token);
    if (!userinfo) return res.status(401).json({ message: "Invalid token" });

    // Find user in DB
    const dbUser = await User.findOne({ email: userinfo.email });
    if (!dbUser) return res.status(404).json({ message: "User not found" });

    // Check old password
    const isMatch = await bcrypt.compare(oldPassword, dbUser.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Old password is incorrect" });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    dbUser.passwordHash = hashedPassword;
    await dbUser.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};