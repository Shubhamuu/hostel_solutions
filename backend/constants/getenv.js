const dotenv = require("dotenv");
dotenv.config();

const getEnv = (key, defaultValue) => {
  const value = process.env[key] ?? defaultValue;
  if (value === undefined) {
    throw new Error(`Environment variable ${key} is not defined`);
  }
  return value;
};

module.exports = {
  PORT: getEnv("PORT", "5000"),
  MONGO_URI: getEnv("MONGO_URI"),
  DB_USERNAME: getEnv("DB_USERNAME"),
  DB_PASSWORD: getEnv("DB_PASSWORD"),

  EMAIL_HOST: getEnv("EMAIL_HOST", "smtp.gmail.com"),
  EMAIL_PORT: getEnv("EMAIL_PORT", "587"),
  EMAIL_USER: getEnv("EMAIL_USER"),
  EMAIL_PASS: getEnv("EMAIL_PASS"),

  REFRESH_SECRET: getEnv("REFRESH_SECRET"),
  ACCESS_SECRET: getEnv("ACCESS_SECRET"),

  KHALTI_API_KEY: getEnv("KHALTI_API_KEY"),

  CLOUDINARY_CLOUD_NAME: getEnv("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: getEnv("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: getEnv("CLOUDINARY_API_SECRET"),
};
