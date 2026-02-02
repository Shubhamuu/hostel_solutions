const User = require('../models/User');
const TempUser = require('../models/tempuser');
const Hostel = require('../models/hostel');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { sendVerificationEmail, successRegistration, codeExpiry } = require('../utils/sendotp');
const generateCode = require('../utils/generatecode');
const { generateTokens, verifyRefreshToken, removeRefreshToken, generateaccessToken } = require('../utils/jwtauth');

exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.headers.authorization?.split(' ')[1];


  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token required" });
  }
  console.log("Received refresh token:", refreshToken);

  const userData = await verifyRefreshToken(refreshToken);
  if (!userData) {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
  console.log("User data from refresh token:", userData);
  const tokens = generateaccessToken(userData); // new access token
  res.json(tokens);
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
  try {
    const { email, verificationCode } = req.body;

    const tempUser = await TempUser.findOne({ email });
    console.log("TempUser found for verification:", tempUser);
    console.log("email:", email, "verificationCode:", verificationCode);
    if (!tempUser) {
      return res.status(400).json({ message: 'Invalid email' });
    }

    if (tempUser.verificationCode !== verificationCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // -------------------------
    // CREATE USER
    // -------------------------
    const userData = {
      name: tempUser.name,
      email: tempUser.email,
      passwordHash: tempUser.passwordHash,
      role: tempUser.role,
      isApproved: tempUser.role === 'ADMIN' ? false : true,
      isVerified: true,
      verifiedAt: new Date(),
      verificationDocuments: tempUser.verificationDocuments || [],
    };

    const user = new User(userData);
    await user.save();

    let hostel = null;

    // -------------------------
    // CREATE HOSTEL (ADMIN ONLY)
    // -------------------------
    if (tempUser.role === 'ADMIN') {
      const existingHostel = await Hostel.findOne({
        name: tempUser.hostelName,
      });

      if (!existingHostel) {
        hostel = new Hostel({
          name: tempUser.hostelName,
          address: tempUser.hostelLocation,
          adminId: user._id,
        });

        await hostel.save();
      } else {
        hostel = existingHostel;
      }

      // Link hostel to admin
      user.managedHostelId = hostel._id;
      await user.save();
    }



    // Optional: success email
    await successRegistration(user.name, user.email);
    console.log("Sent success registration email to:", user.email);
    // -------------------------
    // CLEANUP TEMP USER
    // -------------------------
    await TempUser.deleteOne({ _id: tempUser._id });
    return res.status(201).json({
      success: true,
      message:
        tempUser.role === 'ADMIN'
          ? 'Registration successful. Awaiting super admin approval.'
          : 'Registration successful. You can now log in.',
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: 'Server error',
      error: err.message,
    });
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
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
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

    user.password = await bcrypt.hash(newPassword, 10);
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