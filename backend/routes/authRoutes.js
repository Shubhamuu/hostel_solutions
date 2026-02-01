const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const upload = require('../middleware/upload');


// POST /api/auth/refresh-token
//router.post("/refresh-token", authController.refreshToken);
// Register new user
router.post('/register', upload.array('verificationDocuments'), authController.register);

// Verify user token
router.post('/verify-otp', authController.verifyOtp);
// Login user
router.post('/login', authController.login);

// Verify email with code
router.post('/verify-email', authController.verifyEmail);

// Request password reset (send email)
router.post('/forgot-password', authController.forgotPassword);

// Reset password using token or code
router.post('/reset-password', authController.resetPassword);
router.get('/access-token', authController.refreshToken);
//router.post('/refresh-token', authController.refresh);
// Middleware to protect routes
router.post('/logout', authController.logout);
module.exports = router;