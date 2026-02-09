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
    user:EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const codeExpiry = new Date(Date.now() + 15 * 60 * 1000); 
const sendVerificationEmail = async (email, name, code) => {
   console.log("from sendverification",email, name, code);
    const mailOptions = {
        from:`"Hostel Management" <${EMAIL_USER}>`,
        to: email,
        subject: "Email Verification",
        text: `Hello ${name},\n\nYour verification code is: ${code}\n\nThis code is valid for 15 minutes.\n\nThank you!`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Verification email sent to ${email}`);
    } catch (error) {
        console.error(`Error sending email: ${error.message}`);
        throw new Error("Failed to send verification email");
    }
};

const successRegistration = async (name, email ) => {
    const mailOptions = {
        from: `"Hostel Management" <${EMAIL_USER}>`,
        to: email,
        subject: "Registration Successful",
        text: `Hello ${name|| User},\n\nYou have successfully registered. Please proceed to login.\n\nThank you!`,
    };
    try {
         const sucess_message= await transporter.sendMail(mailOptions);
            return ({
                success: true,
                message: "Registration successful. Proceed to login.",
            });

    } catch (error) {
        console.error(`Error sending registration success email: ${error.message}`);
    }
}
const userRegistered = async (name, email, password) => {
  const mailOptions = {
    from: `"Hostel Management" <${EMAIL_USER}>`,
    to: email,
    subject: "Registration on Hostel Successful",
    text: `Hello ${name || 'User'},\n\nYou have successfully registered to the hostel.\n Please proceed to login and change your password.\n\nEmail: ${email}\nPassword: ${password}\n\nThank you!`,
  };

  try {
    const success_message = await transporter.sendMail(mailOptions);
    console.log("Email sent:", success_message.messageId);
    return {
      success: true,
      message: "Registration successful. Proceed to login.",
    };
  } catch (error) {
    console.error(`Error sending registration success email: ${error.message}`);
    return {
      success: false,
      message: "Registration successful, but failed to send email.",
    };
  }
};

module.exports = {
    sendVerificationEmail, successRegistration, codeExpiry, userRegistered };
