const {
  Task,
  Project,
  Admin,
  Material,
  Equipment,
  Labor,
  Budget,
} = require("../models");

// Get all tasks
const getAllTasks = async (req, res) => {
  try {
    const { project_id, status, assigned_to, page, limit } = req.query;

    let whereClause = {};
    if (project_id) {
      whereClause.project_id = project_id;
    }
    if (status) {
      whereClause.status = status;
    }
    if (assigned_to) {
      whereClause.assigned_to_admin = assigned_to;
    }

    // Parse pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await Task.count({ where: whereClause });

    // Get paginated tasks
    const tasks = await Task.findAll({
      where: whereClause,
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "status", "progress_percent"],
        },
        {
          model: Admin,
          as: "assignedAdmin",
          attributes: ["id", "name", "email", "role"],
        },
      ],
      order: [["due_date", "ASC"]],
      limit: limitNum,
      offset: offset,
    });

    res.status(200).json({
      success: true,
      data: tasks,
      count: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tasks",
      error: error.message,
    });
  }
};

// Get task by ID
const getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id, {
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
          model: Admin,
          as: "assignedAdmin",
          attributes: ["id", "name", "email", "role", "phone"],
        },
        {
          model: Material,
          as: "materials",
          attributes: [
            "id",
            "name",
            "unit",
            "unit_cost",
            "quantity_required",
            "quantity_used",
          ],
        },
        {
          model: Equipment,
          as: "equipment",
          attributes: [
            "id",
            "name",
            "type",
            "availability",
            "rental_cost_per_day",
          ],
        },
        {
          model: Labor,
          as: "labor",
          attributes: [
            "id",
            "worker_name",
            "worker_type",
            "hourly_rate",
            "hours_worked",
            "total_cost",
            "start_date",
            "end_date",
            "status",
            "phone",
            "skills",
            "is_requirement",
            "required_quantity",
          ],
        },
        {
          model: Budget,
          as: "budgets",
          attributes: [
            "id",
            "category",
            "amount",
            "type",
            "date",
            "entry_type",
            "calculated_amount",
            "quantity",
          ],
          include: [
            {
              model: Material,
              as: "material",
              attributes: ["id", "name", "unit", "unit_cost"],
            },
            {
              model: Equipment,
              as: "equipment",
              attributes: ["id", "name", "type", "rental_cost_per_day"],
            },
            {
              model: Labor,
              as: "labor",
              attributes: ["id", "worker_name", "worker_type", "hourly_rate"],
            },
          ],
        },
      ],
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching task",
      error: error.message,
    });
  }
};

// Create new task
const createTask = async (req, res) => {
  try {
    const {
      project_id,
      name,
      description,
      start_date,
      due_date,
      assigned_to_admin,
    } = req.body;

    // Verify project exists
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(400).json({
        success: false,
        message: "Project not found",
      });
    }

    // Verify admin exists
    const admin = await Admin.findByPk(assigned_to_admin);
    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Admin not found",
      });
    }

    const task = await Task.create({
      project_id,
      name,
      description,
      start_date,
      due_date,
      assigned_to_admin,
    });

    // Fetch the created task with associations
    const createdTask = await Task.findByPk(task.id, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "status"],
        },
        {
          model: Admin,
          as: "assignedAdmin",
          attributes: ["id", "name", "email", "role"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: createdTask,
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({
      success: false,
      message: "Error creating task",
      error: error.message,
    });
  }
};

// Update task
const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
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

    // Verify admin exists if being updated
    if (updateData.assigned_to_admin) {
      const admin = await Admin.findByPk(updateData.assigned_to_admin);
      if (!admin) {
        return res.status(400).json({
          success: false,
          message: "Admin not found",
        });
      }
    }

    await task.update(updateData);

    // Fetch updated task with associations
    const updatedTask = await Task.findByPk(id, {
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "status"],
        },
        {
          model: Admin,
          as: "assignedAdmin",
          attributes: ["id", "name", "email", "role"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({
      success: false,
      message: "Error updating task",
      error: error.message,
    });
  }
};

// Update task status
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress_percent } = req.body;

    const validStatuses = ["pending", "in_progress", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });
    }

    if (progress_percent < 0 || progress_percent > 100) {
      return res.status(400).json({
        success: false,
        message: "Progress percentage must be between 0 and 100",
      });
    }

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await task.update({ status, progress_percent });

    res.status(200).json({
      success: true,
      message: "Task status updated successfully",
      data: { status, progress_percent },
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating task status",
      error: error.message,
    });
  }
};

// Delete task
const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    await task.destroy();

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting task",
      error: error.message,
    });
  }
};

// Get tasks by project
const getTasksByProject = async (req, res) => {
  try {
    const { project_id } = req.params;

    const tasks = await Task.findAll({
      where: { project_id },
      include: [
        {
          model: Admin,
          as: "assignedAdmin",
          attributes: ["id", "name", "email", "role"],
        },
      ],
      order: [["due_date", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error("Error fetching tasks by project:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tasks by project",
      error: error.message,
    });
  }
};

// Get overdue tasks
const getOverdueTasks = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await Task.findAll({
      where: {
        due_date: {
          [require("sequelize").Op.lt]: today,
        },
        status: {
          [require("sequelize").Op.ne]: "completed",
        },
      },
      include: [
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "status"],
        },
        {
          model: Admin,
          as: "assignedAdmin",
          attributes: ["id", "name", "email", "role"],
        },
      ],
      order: [["due_date", "ASC"]],
    });

    res.status(200).json({
      success: true,
      data: tasks,
      count: tasks.length,
    });
  } catch (error) {
    console.error("Error fetching overdue tasks:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching overdue tasks",
      error: error.message,
    });
  }
};

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTasksByProject,
  getOverdueTasks,
};
