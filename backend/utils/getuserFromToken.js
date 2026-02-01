const jwt = require("jsonwebtoken");
require("dotenv").config();

const ACCESS_SECRET = process.env.ACCESS_SECRET;

const getUserFromToken = (token) => {
  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);
    return {
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    };
  } catch (err) {
    console.error("Token verification failed:", err.message);
    return err;
  }
};

module.exports = getUserFromToken;
