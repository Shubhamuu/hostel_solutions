const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config();
const crypto = require("crypto");
const EMAIL_HOST = require("../constants/getenv").EMAIL_HOST;
const EMAIL_PORT = require("../constants/getenv").EMAIL_PORT;
const EMAIL_USER = require("../constants/getenv").EMAIL_USER;
const EMAIL_PASS = require("../constants/getenv").EMAIL_PASS;
//const generateVerificationCode = () => crypto.randomBytes(3).toString("hex");

const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const codeExpiry = new Date(Date.now() + 15 * 60 * 1000);
// ─── Shared HTML wrapper ────────────────────────────────────────────────────
const buildEmail = ({ title, preheader, bodyHtml }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="background:#ffffff;border-radius:12px;overflow:hidden;
                      box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
                       padding:36px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;
                         letter-spacing:-0.5px;">🏠 Hostel Management</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa;padding:24px 40px;text-align:center;
                       border-top:1px solid #e9ecef;">
              <p style="margin:0;color:#adb5bd;font-size:13px;line-height:1.6;">
                This email was sent by <strong>Hostel Management System</strong>.<br/>
                If you did not request this, please ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// ─── Helpers ────────────────────────────────────────────────────────────────
const greeting = (name) =>
  `<p style="margin:0 0 20px;color:#495057;font-size:16px;">
     Hi <strong>${name}</strong>,
   </p>`;

const divider = `<hr style="border:none;border-top:1px solid #e9ecef;margin:28px 0;"/>`;

const sendMail = async (mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`[Mailer] Failed to send "${mailOptions.subject}":`, error.message);
    throw new Error(`Failed to send email: ${mailOptions.subject}`);
  }
};

// ─── 1. Verification OTP Email ───────────────────────────────────────────────
const sendVerificationEmail = async (email, name, code) => {
  const html = buildEmail({
    title: "Verify your email",
    preheader: `Your verification code is ${code}`,
    bodyHtml: `
      ${greeting(name)}
      <p style="margin:0 0 28px;color:#6c757d;font-size:15px;line-height:1.7;">
        Use the code below to verify your email address.
        It expires in <strong>15 minutes</strong>.
      </p>

      <!-- OTP Box -->
      <div style="background:#f0f4ff;border:2px dashed #667eea;border-radius:12px;
                  padding:28px;text-align:center;margin-bottom:28px;">
        <p style="margin:0 0 8px;color:#667eea;font-size:13px;
                  font-weight:600;letter-spacing:1px;text-transform:uppercase;">
          Verification Code
        </p>
        <p style="margin:0;color:#2d3748;font-size:42px;font-weight:800;
                  letter-spacing:10px;">
          ${code}
        </p>
      </div>

      ${divider}
      <p style="margin:0;color:#adb5bd;font-size:13px;text-align:center;">
        ⚠️ Never share this code with anyone.
      </p>
    `,
  });

  await sendMail({
    from: `"Hostel Management" <${EMAIL_USER}>`,
    to: email,
    subject: "🔐 Your Verification Code",
    text: `Hi ${name},\n\nYour verification code is: ${code}\n\nThis code is valid for 15 minutes.\n\nNever share this code with anyone.`,
    html,
  });

  console.log(`[Mailer] Verification email sent → ${email}`);
};

// ─── 2. Registration Success Email ──────────────────────────────────────────
const successRegistration = async (name, email) => {
  const html = buildEmail({
    title: "Registration Successful",
    preheader: "Welcome aboard! Your account has been created.",
    bodyHtml: `
      ${greeting(name)}
      <p style="margin:0 0 24px;color:#6c757d;font-size:15px;line-height:1.7;">
        🎉 Your account has been <strong>successfully created</strong>.
        You can now log in and explore everything Hostel Management has to offer.
      </p>

      <!-- CTA -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${process.env.CLIENT_URL}/login"
           style="background:linear-gradient(135deg,#667eea,#764ba2);
                  color:#ffffff;text-decoration:none;padding:14px 36px;
                  border-radius:8px;font-size:15px;font-weight:600;
                  display:inline-block;letter-spacing:0.3px;">
          Go to Login →
        </a>
      </div>

      ${divider}
      <p style="margin:0;color:#adb5bd;font-size:13px;text-align:center;">
        Need help? Reply to this email and we'll assist you.
      </p>
    `,
  });

  await sendMail({
    from: `"Hostel Management" <${EMAIL_USER}>`,
    to: email,
    subject: "🎉 Registration Successful — Welcome!",
    text: `Hi ${name},\n\nYour account has been successfully created.\nYou can now log in at ${process.env.CLIENT_URL}/login.\n\nThank you!`,
    html,
  });

  console.log(`[Mailer] Success registration email sent → ${email}`);
  return { success: true, message: "Registration successful. Proceed to login." };
};

// ─── 3. Admin-Created Account Email ─────────────────────────────────────────
const userRegistered = async (name, email, password) => {
  const html = buildEmail({
    title: "Your Hostel Account is Ready",
    preheader: "An account has been created for you. Here are your login details.",
    bodyHtml: `
      ${greeting(name)}
      <p style="margin:0 0 24px;color:#6c757d;font-size:15px;line-height:1.7;">
        An account has been created for you on <strong>Hostel Management</strong>.
        Please use the credentials below to log in, then change your password immediately.
      </p>

      <!-- Credentials Box -->
      <div style="background:#f8f9fa;border-radius:10px;padding:24px;
                  margin-bottom:28px;border-left:4px solid #667eea;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:8px 0;color:#6c757d;font-size:14px;width:90px;">
              <strong>Email</strong>
            </td>
            <td style="padding:8px 0;color:#2d3748;font-size:14px;">${email}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6c757d;font-size:14px;">
              <strong>Password</strong>
            </td>
            <td style="padding:8px 0;color:#2d3748;font-size:14px;
                       font-family:monospace;letter-spacing:1px;">
              ${password}
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${process.env.CLIENT_URL}/login"
           style="background:linear-gradient(135deg,#667eea,#764ba2);
                  color:#ffffff;text-decoration:none;padding:14px 36px;
                  border-radius:8px;font-size:15px;font-weight:600;
                  display:inline-block;">
          Log In Now →
        </a>
      </div>

      ${divider}
      <p style="margin:0;color:#e74c3c;font-size:13px;text-align:center;">
        🔒 For your security, please change your password immediately after logging in.
      </p>
    `,
  });

  await sendMail({
    from: `"Hostel Management" <${EMAIL_USER}>`,
    to: email,
    subject: "🏠 Your Hostel Account is Ready",
    text: `Hi ${name},\n\nAn account has been created for you.\n\nEmail: ${email}\nPassword: ${password}\n\nPlease log in and change your password immediately.\n\n${process.env.CLIENT_URL}/login`,
    html,
  });

  console.log(`[Mailer] User registered email sent → ${email}`);
  return { success: true, message: "Registration successful. Proceed to login." };
};

const sendHostelDeletionEmail = async (adminEmail, adminName, hostelName, deletionReason) => {
  const mailOptions = {
    from: `"Hostel Management" <${EMAIL_USER}>`,
    to: adminEmail,
    subject: "Hostel Account Deletion Notice",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #d32f2f; text-align: center;">Hostel Account Deletion Notice</h2>
        <p>Dear ${adminName},</p>
        
        <p>We regret to inform you that your hostel <strong>"${hostelName}"</strong> has been removed from our platform by the system administrator.</p>
        
        <div style="background-color: #fff3e0; padding: 15px; border-left: 4px solid #ff9800; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #f57c00;">Reason for Deletion:</h3>
          <p style="margin-bottom: 0;">${deletionReason}</p>
        </div>
        
        <p>Your admin account associated with this hostel has also been removed from the system.</p>
        
        <p>If you believe this action was taken in error or have any questions, please contact our support team.</p>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
        
        <p style="color: #666; font-size: 12px; text-align: center;">
          This is an automated message from Hostel Management System.<br>
          Please do not reply to this email.
        </p>
      </div>
    `,
    text: `Dear ${adminName},\n\nWe regret to inform you that your hostel "${hostelName}" has been removed from our platform.\n\nReason: ${deletionReason}\n\nYour admin account has also been removed from the system.\n\nIf you have any questions, please contact support.\n\nThank you,\nHostel Management System`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Deletion notification sent to ${adminEmail}`);
    return { success: true };
  } catch (error) {
    console.error(`Error sending deletion email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

const sendDisbursementEmail = async (adminEmail, adminName, hostelName, totalCollected, serviceFee, amountDisbursed, feesCount) => {
  const mailOptions = {
    from: `"Hostel Management" <${EMAIL_USER}>`,
    to: adminEmail,
    subject: "Payment Disbursement - Hostel Management",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #1976d2; text-align: center;">Payment Disbursement Notice</h2>
        <p>Dear ${adminName},</p>

        <p>A payment disbursement has been processed for your hostel <strong>"${hostelName}"</strong>.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Total Collected (Khalti)</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">Rs. ${totalCollected.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Service Fee (0.1%)</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right; color: #d32f2f;">- Rs. ${serviceFee.toFixed(2)}</td>
          </tr>
          <tr style="background-color: #e8f5e9;">
            <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; font-size: 16px;">Net Amount Disbursed</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right; font-weight: bold; font-size: 16px; color: #2e7d32;">Rs. ${amountDisbursed.toFixed(2)}</td>
          </tr>
          <tr style="background-color: #f5f5f5;">
            <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">Fees Processed</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${feesCount} payment(s)</td>
          </tr>
        </table>

        <p style="color: #666; font-size: 12px; text-align: center;">
          This is an automated message from Hostel Management System.<br>
          Please do not reply to this email.
        </p>
      </div>
    `,
    text: `Dear ${adminName},\n\nPayment disbursement for "${hostelName}":\n\nTotal Collected: Rs. ${totalCollected.toFixed(2)}\nService Fee (0.1%): Rs. ${serviceFee.toFixed(2)}\nNet Disbursed: Rs. ${amountDisbursed.toFixed(2)}\nFees Processed: ${feesCount}\n\nThank you,\nHostel Management System`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Disbursement email sent to ${adminEmail}`);
    return { success: true };
  } catch (error) {
    console.error(`Error sending disbursement email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendVerificationEmail, successRegistration, codeExpiry, userRegistered, sendHostelDeletionEmail, sendDisbursementEmail
};
