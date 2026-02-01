const jwt = require("jsonwebtoken");
require("dotenv").config();
const Token = require("../models/Token");

const ACCESS_SECRET = require("../constants/getenv").ACCESS_SECRET;
const REFRESH_SECRET = require("../constants/getenv").REFRESH_SECRET;

// Generate access + refresh token
const generateTokens = async ({ _id, name, email, role }) => {
  const payload = { id: _id, name, email, role };

  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
  const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: "7d" });

  await new Token({ userId: _id, token: refreshToken }).save();

  return { accessToken, refreshToken };
};

const generateaccessToken = (userData) => {
  const payload = { email: userData.email, name: userData.name, role: userData.role };
  const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: "15m" });
  return { accessToken };
};

// Verify refresh token
const verifyRefreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET);
    const storedToken = await Token.findOne({ token });

    if (!storedToken) {
      throw new Error("Token not found in database");
    }

    console.log("Refresh token verified successfully.");
    return decoded;
  } catch (err) {
    return null;
  }
};

// Remove refresh token on logout
const removeRefreshToken = async (token) => {
  await Token.findOneAndDelete({ token });
};

const verifyToken = (token) => {
  if (!token) {
    return null;
  }
  try {
    const userData = jwt.verify(token, ACCESS_SECRET);
    console.log("Access token verified successfully.");
    return userData;
  } catch (err) {
    return null;
  }
}

module.exports = {
  generateTokens,
  verifyRefreshToken,
  removeRefreshToken,
  verifyToken,
  generateaccessToken
};
