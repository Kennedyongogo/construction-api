const { Issue, Project, User } = require("../models");

// Get all issues
const getAllIssues = async (req, res) => {
  try {
    const { project_id, status, submitted_by, page, limit } = req.query;

    let whereClause = {};
    if (project_id) {
      whereClause.project_id = project_id;
    }
    if (status) {
      whereClause.status = status;
    }
    if (submitted_by) {
      whereClause.submitted_by_user_id = submitted_by;
    }

    // Parse pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await Issue.count({ where: whereClause });

    // Get paginated issues
    const issues = await Issue.findAll({
      where: whereClause,
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "status", "progress_percent"],
        },
        {
          model: User,
          as: "submittedBy",
          attributes: ["id", "name", "type", "email"],
        },
      ],
      order: [["date_reported", "DESC"]],
      limit: limitNum,
      offset: offset,
    });

    res.status(200).json({
      success: true,
      data: issues,
      count: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    });
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching issues",
      error: error.message,
    });
  }
};

// Get issue by ID
const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await Issue.findByPk(id, {
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
        {
          model: User,
          as: "submittedBy",
          attributes: ["id", "name", "type", "email", "phone"],
        },
      ],
    });

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    res.status(200).json({
      success: true,
      data: issue,
    });
  } catch (error) {
    console.error("Error fetching issue:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching issue",
      error: error.message,
    });
  }
};

// Create new issue
const createIssue = async (req, res) => {
  try {
    const {
      project_id,
      submitted_by_user_id,
      description,
      status,
      date_reported,
    } = req.body;

    // Verify project exists
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(400).json({
        success: false,
        message: "Project not found",
      });
    }

    // Verify user exists if provided
    if (submitted_by_user_id) {
      const user = await User.findByPk(submitted_by_user_id);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
    }

    const issue = await Issue.create({
      project_id,
      submitted_by_user_id,
      description,
      status: status || "open",
      date_reported: date_reported || new Date(),
    });

    // Fetch the created issue with associations
    const createdIssue = await Issue.findByPk(issue.id, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "status"],
        },
        {
          model: User,
          as: "submittedBy",
          attributes: ["id", "name", "type"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: createdIssue,
    });
  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(500).json({
      success: false,
      message: "Error creating issue",
      error: error.message,
    });
  }
};

// Update issue
const updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const issue = await Issue.findByPk(id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
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

    // Verify user exists if being updated
    if (updateData.submitted_by_user_id) {
      const user = await User.findByPk(updateData.submitted_by_user_id);
      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User not found",
        });
      }
    }

    await issue.update(updateData);

    // Fetch updated issue with associations
    const updatedIssue = await Issue.findByPk(id, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "status"],
        },
        {
          model: User,
          as: "submittedBy",
          attributes: ["id", "name", "type"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: updatedIssue,
    });
  } catch (error) {
    console.error("Error updating issue:", error);
    res.status(500).json({
      success: false,
      message: "Error updating issue",
      error: error.message,
    });
  }
};

// Update issue status
const updateIssueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["open", "in_review", "resolved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const issue = await Issue.findByPk(id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    await issue.update({ status });

    res.status(200).json({
      success: true,
      message: "Issue status updated successfully",
      data: { status },
    });
  } catch (error) {
    console.error("Error updating issue status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating issue status",
      error: error.message,
    });
  }
};

// Delete issue
const deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;

    const issue = await Issue.findByPk(id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    await issue.destroy();

    res.status(200).json({
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting issue:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting issue",
      error: error.message,
    });
  }
};

// Get issues by project
const getIssuesByProject = async (req, res) => {
  try {
    const { project_id } = req.params;

    const issues = await Issue.findAll({
      where: { project_id },
      include: [
        {
          model: User,
          as: "submittedBy",
          attributes: ["id", "name", "type", "email"],
        },
      ],
      order: [["date_reported", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: issues,
      count: issues.length,
    });
  } catch (error) {
    console.error("Error fetching issues by project:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching issues by project",
      error: error.message,
    });
  }
};

// Get issues by status
const getIssuesByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const validStatuses = ["open", "in_review", "resolved"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    const issues = await Issue.findAll({
      where: { status },
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "status"],
        },
        {
          model: User,
          as: "submittedBy",
          attributes: ["id", "name", "type"],
        },
      ],
      order: [["date_reported", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: issues,
      count: issues.length,
    });
  } catch (error) {
    console.error("Error fetching issues by status:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching issues by status",
      error: error.message,
    });
  }
};

// Get issues by user
const getIssuesByUser = async (req, res) => {
  try {
    const { user_id } = req.params;

    const issues = await Issue.findAll({
      where: { submitted_by_user_id: user_id },
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "status"],
        },
      ],
      order: [["date_reported", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: issues,
      count: issues.length,
    });
  } catch (error) {
    console.error("Error fetching issues by user:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching issues by user",
      error: error.message,
    });
  }
};

// Get issue statistics
const getIssueStatistics = async (req, res) => {
  try {
    const { project_id } = req.params;

    const issues = await Issue.findAll({
      where: project_id ? { project_id } : {},
      attributes: ["status", "date_reported"],
    });

    // Group by status
    const statusStats = issues.reduce((acc, issue) => {
      const status = issue.status;
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status]++;
      return acc;
    }, {});

    // Group by month
    const monthlyStats = issues.reduce((acc, issue) => {
      const month = new Date(issue.date_reported).toISOString().substring(0, 7);
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month]++;
      return acc;
    }, {});

    const stats = {
      total_issues: issues.length,
      status_breakdown: statusStats,
      monthly_reports: monthlyStats,
      open_issues: statusStats.open || 0,
      resolved_issues: statusStats.resolved || 0,
      resolution_rate:
        issues.length > 0
          ? Math.round(((statusStats.resolved || 0) / issues.length) * 100)
          : 0,
    };

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching issue statistics:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching issue statistics",
      error: error.message,
    });
  }
};

module.exports = {
  getAllIssues,
  getIssueById,
  createIssue,
  updateIssue,
  updateIssueStatus,
  deleteIssue,
  getIssuesByProject,
  getIssuesByStatus,
  getIssuesByUser,
  getIssueStatistics,
};
