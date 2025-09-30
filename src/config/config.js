require("dotenv").config();

module.exports = {
  // Server configuration
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || "development",

  // Database configuration for local development
  database: {
    host: process.env.PGHOST || "localhost",
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE || "construction",
    username: process.env.PGUSER || "postgres",
    password: process.env.PGPASSWORD || "MobileST!!",
  },

  // JWT configuration
  jwtSecret:
    process.env.JWT_SECRET || "franklyne_kibogo_campaign_secret_key_2024",

  // Email service (optional for notifications)
  emailService: {
    provider: process.env.EMAIL_SERVICE || "gmail",
    user: process.env.EMAIL_USER || "",
    pass: process.env.EMAIL_PASS || "",
  },

  // SMS service (optional for notifications)
  smsService: {
    apiKey: process.env.SMS_API_KEY || "",
    apiSecret: process.env.SMS_API_SECRET || "",
  },
};
