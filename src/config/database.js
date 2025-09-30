// config/database.js
require("dotenv").config();
const { Sequelize } = require("sequelize");
const config = require("./config");

// Create Sequelize instance for local development
const sequelize = new Sequelize(
  config.database.database,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: "postgres",
    logging: config.nodeEnv === "development" ? console.log : false, // Enable logging in development
    pool: {
      max: 10, // Maximum number of connections
      min: 0, // Minimum number of connections
      acquire: 30000, // Maximum time to get connection
      idle: 10000, // Maximum time connection can be idle
    },
    dialectOptions: {
      // PostgreSQL specific options
      application_name: "construction_management_api",
    },
  }
);

// Test database connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established successfully.");
    console.log(
      `📊 Connected to: ${config.database.database}@${config.database.host}:${config.database.port}`
    );
  } catch (error) {
    console.error("❌ Database connection error:", error.message);
    throw error;
  }
};

// Sync database (create tables if they don't exist)
const syncDatabase = async (force = false) => {
  try {
    await sequelize.sync({ force });
    console.log("✅ Database synchronized successfully.");
  } catch (error) {
    console.error("❌ Database sync error:", error.message);
    throw error;
  }
};

// Export sequelize instance and helper functions
module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};
