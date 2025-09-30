const { ProgressUpdate, Project } = require("../models");

// Get all progress updates
const getAllProgressUpdates = async (req, res) => {
  try {
    const { project_id, page, limit } = req.query;

    let whereClause = {};
    if (project_id) {
      whereClause.project_id = project_id;
    }

    // Parse pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await ProgressUpdate.count({ where: whereClause });

    // Get paginated progress updates
    const progressUpdates = await ProgressUpdate.findAll({
      where: whereClause,
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "status", "progress_percent"],
        },
      ],
      order: [["date", "DESC"]],
      limit: limitNum,
      offset: offset,
    });

    res.status(200).json({
      success: true,
      data: progressUpdates,
      count: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    });
  } catch (error) {
    console.error("Error fetching progress updates:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching progress updates",
      error: error.message,
    });
  }
};

// Get progress update by ID
const getProgressUpdateById = async (req, res) => {
  try {
    const { id } = req.params;
    const progressUpdate = await ProgressUpdate.findByPk(id, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: [
            "id",
            "name",
            "status",
            "progress_percent",
            "start_date",
            "end_date",
          ],
        },
      ],
    });

    if (!progressUpdate) {
      return res.status(404).json({
        success: false,
        message: "Progress update not found",
      });
    }

    res.status(200).json({
      success: true,
      data: progressUpdate,
    });
  } catch (error) {
    console.error("Error fetching progress update:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching progress update",
      error: error.message,
    });
  }
};

// Create new progress update
const createProgressUpdate = async (req, res) => {
  try {
    const { project_id, description, progress_percent, images, date } =
      req.body;

    // Verify project exists
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(400).json({
        success: false,
        message: "Project not found",
      });
    }

    // Validate progress percentage
    if (progress_percent < 0 || progress_percent > 100) {
      return res.status(400).json({
        success: false,
        message: "Progress percentage must be between 0 and 100",
      });
    }

    const progressUpdate = await ProgressUpdate.create({
      project_id,
      description,
      progress_percent,
      images: images || [],
      date: date || new Date(),
    });

    // Update project progress if this is the latest update
    if (progress_percent > project.progress_percent) {
      await project.update({ progress_percent });
    }

    // Fetch the created progress update with associations
    const createdProgressUpdate = await ProgressUpdate.findByPk(
      progressUpdate.id,
      {
        include: [
          {
            model: Project,
            as: "project",
            attributes: ["id", "name", "status"],
          },
        ],
      }
    );

    res.status(201).json({
      success: true,
      message: "Progress update created successfully",
      data: createdProgressUpdate,
    });
  } catch (error) {
    console.error("Error creating progress update:", error);
    res.status(500).json({
      success: false,
      message: "Error creating progress update",
      error: error.message,
    });
  }
};

// Update progress update
const updateProgressUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const progressUpdate = await ProgressUpdate.findByPk(id);
    if (!progressUpdate) {
      return res.status(404).json({
        success: false,
        message: "Progress update not found",
      });
    }

    // Validate progress percentage if being updated
    if (updateData.progress_percent !== undefined) {
      if (
        updateData.progress_percent < 0 ||
        updateData.progress_percent > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "Progress percentage must be between 0 and 100",
        });
      }
    }

    // Verify project exists if being updated
    if (updateData.project_id) {
      const project = await Project.findByPk(updateData.project_id);
      if (!project) {
        return res.status(400).json({
          success: false,
          message: "Project not found",
        });
      }
    }

    await progressUpdate.update(updateData);

    // Update project progress if this is the latest update
    if (updateData.progress_percent !== undefined) {
      const project = await Project.findByPk(progressUpdate.project_id);
      if (project && updateData.progress_percent > project.progress_percent) {
        await project.update({ progress_percent: updateData.progress_percent });
      }
    }

    // Fetch updated progress update with associations
    const updatedProgressUpdate = await ProgressUpdate.findByPk(id, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "status"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Progress update updated successfully",
      data: updatedProgressUpdate,
    });
  } catch (error) {
    console.error("Error updating progress update:", error);
    res.status(500).json({
      success: false,
      message: "Error updating progress update",
      error: error.message,
    });
  }
};

// Delete progress update
const deleteProgressUpdate = async (req, res) => {
  try {
    const { id } = req.params;

    const progressUpdate = await ProgressUpdate.findByPk(id);
    if (!progressUpdate) {
      return res.status(404).json({
        success: false,
        message: "Progress update not found",
      });
    }

    await progressUpdate.destroy();

    res.status(200).json({
      success: true,
      message: "Progress update deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting progress update:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting progress update",
      error: error.message,
    });
  }
};

// Get progress updates by project
const getProgressUpdatesByProject = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const progressUpdates = await ProgressUpdate.findAndCountAll({
      where: { project_id },
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "status"],
        },
      ],
      order: [["date", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    res.status(200).json({
      success: true,
      data: progressUpdates.rows,
      count: progressUpdates.count,
      total_pages: Math.ceil(progressUpdates.count / limit),
    });
  } catch (error) {
    console.error("Error fetching progress updates by project:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching progress updates by project",
      error: error.message,
    });
  }
};

// Get latest progress updates
const getLatestProgressUpdates = async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const progressUpdates = await ProgressUpdate.findAll({
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "status", "progress_percent"],
        },
      ],
      order: [["date", "DESC"]],
      limit: parseInt(limit),
    });

    res.status(200).json({
      success: true,
      data: progressUpdates,
      count: progressUpdates.length,
    });
  } catch (error) {
    console.error("Error fetching latest progress updates:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching latest progress updates",
      error: error.message,
    });
  }
};

// Get progress timeline for project
const getProgressTimeline = async (req, res) => {
  try {
    const { project_id } = req.params;

    const progressUpdates = await ProgressUpdate.findAll({
      where: { project_id },
      attributes: ["id", "description", "progress_percent", "images", "date"],
      order: [["date", "ASC"]],
    });

    // Create timeline with progress milestones
    const timeline = progressUpdates.map((update, index) => {
      const previousUpdate = index > 0 ? progressUpdates[index - 1] : null;
      const progressChange = previousUpdate
        ? update.progress_percent - previousUpdate.progress_percent
        : update.progress_percent;

      return {
        id: update.id,
        date: update.date,
        description: update.description,
        progress_percent: update.progress_percent,
        progress_change: progressChange,
        images: update.images,
        is_milestone: progressChange >= 10 || update.progress_percent === 100,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        project_id,
        timeline,
        total_updates: timeline.length,
        milestones: timeline.filter((item) => item.is_milestone),
      },
    });
  } catch (error) {
    console.error("Error fetching progress timeline:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching progress timeline",
      error: error.message,
    });
  }
};

module.exports = {
  getAllProgressUpdates,
  getProgressUpdateById,
  createProgressUpdate,
  updateProgressUpdate,
  deleteProgressUpdate,
  getProgressUpdatesByProject,
  getLatestProgressUpdates,
  getProgressTimeline,
};
