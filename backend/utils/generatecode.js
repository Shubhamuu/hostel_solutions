const crypto = require('crypto');

const generateCode = () => {
  return crypto.randomBytes(3).toString('hex'); // 6-char code (e.g. "a9f42c")
};

module.exports = generateCode;
