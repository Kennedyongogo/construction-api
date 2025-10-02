const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");

const { initializeModels, setupAssociations } = require("./models");
const { errorHandler } = require("./middleware/errorHandler");

// Import all routes
const adminRoutes = require("./routes/adminRoutes");
const userRoutes = require("./routes/userRoutes");
const projectRoutes = require("./routes/projectRoutes");
const taskRoutes = require("./routes/taskRoutes");
const materialRoutes = require("./routes/materialRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const laborRoutes = require("./routes/laborRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const documentRoutes = require("./routes/documentRoutes");
const progressUpdateRoutes = require("./routes/progressUpdateRoutes");
const issueRoutes = require("./routes/issueRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`🔍 [${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`📋 Headers:`, req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`📦 Body:`, req.body);
  }
  next();
});

// Static file serving for project documents and images
const projectsUploadPath = path.join(__dirname, "..", "uploads", "projects");
const documentsUploadPath = path.join(__dirname, "..", "uploads", "documents");
const progressUpdatesUploadPath = path.join(
  __dirname,
  "..",
  "uploads",
  "progress-updates"
);

console.log("📁 Projects upload path:", projectsUploadPath);
console.log("📁 Documents upload path:", documentsUploadPath);
console.log("📁 Progress Updates upload path:", progressUpdatesUploadPath);
console.log("📁 Projects directory exists:", fs.existsSync(projectsUploadPath));
console.log(
  "📁 Documents directory exists:",
  fs.existsSync(documentsUploadPath)
);
console.log(
  "📁 Progress Updates directory exists:",
  fs.existsSync(progressUpdatesUploadPath)
);

app.use("/uploads/projects", express.static(projectsUploadPath));
app.use("/uploads/documents", express.static(documentsUploadPath));
app.use("/uploads/progress-updates", express.static(progressUpdatesUploadPath));

// API routes
console.log("🔗 Registering API routes...");
app.use("/api/admins", adminRoutes);
console.log("✅ /api/admins route registered");
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/materials", materialRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/labor", laborRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/progress-updates", progressUpdateRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/notifications", notificationRoutes);
console.log("✅ All API routes registered");

// Error handling middleware
app.use(errorHandler);

// Create upload directories if they don't exist
const createUploadDirectories = () => {
  const uploadDirs = [
    path.join(__dirname, "..", "uploads"),
    path.join(__dirname, "..", "uploads", "projects"),
    path.join(__dirname, "..", "uploads", "documents"),
  ];

  uploadDirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created upload directory: ${dir}`);
    }
  });
};

// Initialize models and associations
const initializeApp = async () => {
  try {
    // Create upload directories
    createUploadDirectories();

    await initializeModels();
    setupAssociations();
    console.log("✅ Application initialized successfully");
    return true;
  } catch (error) {
    console.error("❌ Error initializing application:", error);
    console.error("❌ Full error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      parent: error.parent?.message,
      original: error.original?.message,
    });
    throw error;
  }
};

// Export the initialization promise
const appInitialized = initializeApp();

module.exports = { app, appInitialized };
