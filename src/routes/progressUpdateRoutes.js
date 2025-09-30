const express = require("express");
const router = express.Router();
const {
  getAllProgressUpdates,
  getProgressUpdateById,
  createProgressUpdate,
  updateProgressUpdate,
  deleteProgressUpdate,
  getProgressUpdatesByProject,
  getLatestProgressUpdates,
  getProgressTimeline,
} = require("../controllers/progressUpdateController");
const { authenticateToken } = require("../middleware/auth");
const { errorHandler } = require("../middleware/errorHandler");

// All routes require authentication
router.use(authenticateToken);

// Progress Update routes
router.get("/", getAllProgressUpdates);
router.get("/latest", getLatestProgressUpdates);
router.get("/timeline/:project_id", getProgressTimeline);
router.get("/project/:project_id", getProgressUpdatesByProject);
router.get("/:id", getProgressUpdateById);
router.post("/", createProgressUpdate);
router.put("/:id", updateProgressUpdate);
router.delete("/:id", deleteProgressUpdate);

// Error handling middleware
router.use(errorHandler);

module.exports = router;
