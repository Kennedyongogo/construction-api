const { Admin, Project, Task, Document } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config/config");

// Get all admins
const getAllAdmins = async (req, res) => {
  try {
    const { page, limit } = req.query;

    // Parse pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await Admin.count();

    // Get paginated admins
    const admins = await Admin.findAll({
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Project,
          as: "managedProjects",
          attributes: ["id", "name", "status", "progress_percent"],
        },
        {
          model: Task,
          as: "assignedTasks",
          attributes: ["id", "name", "status", "progress_percent"],
        },
        {
          model: Document,
          as: "uploadedDocuments",
          attributes: ["id", "file_name", "file_type"],
        },
      ],
      limit: limitNum,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json({
      success: true,
      data: admins,
      count: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    });
  } catch (error) {
    console.error("Error fetching admins:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching admins",
      error: error.message,
    });
  }
};

// Get admin by ID
const getAdminById = async (req, res) => {
  try {
    const { id } = req.params;
    const admin = await Admin.findByPk(id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Project,
          as: "managedProjects",
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
          model: Task,
          as: "assignedTasks",
          attributes: ["id", "name", "status", "progress_percent", "due_date"],
        },
        {
          model: Document,
          as: "uploadedDocuments",
          attributes: ["id", "file_name", "file_type", "createdAt"],
        },
      ],
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error("Error fetching admin:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching admin",
      error: error.message,
    });
  }
};

// Create new admin
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // Handle profile picture file upload
    let profile_picture = null;
    if (req.file) {
      profile_picture = req.file.path; // Store the file path
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "Admin with this email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      profile_picture,
    });

    // Remove password from response
    const adminResponse = admin.toJSON();
    delete adminResponse.password;

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: adminResponse,
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({
      success: false,
      message: "Error creating admin",
      error: error.message,
    });
  }
};

// Update admin
const updateAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, isActive } = req.body;

    // Handle profile picture file upload
    let profile_picture = null;
    if (req.file) {
      profile_picture = req.file.path; // Store the file path
    }

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== admin.email) {
      const existingAdmin = await Admin.findOne({ where: { email } });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: "Admin with this email already exists",
        });
      }
    }

    // Prepare update data
    const updateData = {
      name: name || admin.name,
      email: email || admin.email,
      role: role || admin.role,
      phone: phone !== undefined ? phone : admin.phone,
      isActive: isActive !== undefined ? isActive : admin.isActive,
    };

    // Only update profile_picture if a new file was uploaded
    if (profile_picture) {
      updateData.profile_picture = profile_picture;
    }

    await admin.update(updateData);

    // Remove password from response
    const adminResponse = admin.toJSON();
    delete adminResponse.password;

    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: adminResponse,
    });
  } catch (error) {
    console.error("Error updating admin:", error);
    res.status(500).json({
      success: false,
      message: "Error updating admin",
      error: error.message,
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    await admin.update({ password: hashedNewPassword });

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: error.message,
    });
  }
};

// Delete admin
const deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const admin = await Admin.findByPk(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    await admin.destroy();

    res.status(200).json({
      success: true,
      message: "Admin deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting admin:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting admin",
      error: error.message,
    });
  }
};

// Admin login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ where: { email } });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    await admin.update({ lastLogin: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
      },
      config.jwtSecret,
      { expiresIn: "24h" }
    );

    // Remove password from response
    const adminResponse = admin.toJSON();
    delete adminResponse.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        admin: adminResponse,
        token,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({
      success: false,
      message: "Error during login",
      error: error.message,
    });
  }
};

module.exports = {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  changePassword,
  deleteAdmin,
  loginAdmin,
};
