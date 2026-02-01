exports.validateFields = (fields, body) => {
  const missing = fields.filter(field => !body[field]);
  if (missing.length > 0) {
    return {
      valid: false,
      message: `Missing required field(s): ${missing.join(', ')}`
    };
  }
  return { valid: true };
};
