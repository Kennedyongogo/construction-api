const { app, appInitialized } = require("./app");
const config = require("./config/config");
const { testConnection } = require("./config/database");

const PORT = config.port;

// Start the server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();

    // Wait for app initialization to complete
    await app.appInitialized;

    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Campaign Management API running on port ${PORT}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(
        `🗄️  Database: ${config.database.database}@${config.database.host}:${config.database.port}`
      );
      console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      console.log("🔄 SIGTERM received, shutting down gracefully...");
      server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      console.log("🔄 SIGINT received, shutting down gracefully...");
      server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
      });
    });

    return server;
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Start the server
startServer();
