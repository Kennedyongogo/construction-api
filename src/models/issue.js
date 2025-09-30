const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Issue = sequelize.define(
    "Issue",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      project_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "projects",
          key: "id",
        },
      },
      submitted_by_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("open", "resolved", "in_review"),
        allowNull: false,
        defaultValue: "open",
      },
      date_reported: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      tableName: "issues",
      timestamps: true,
    }
  );

  return Issue;
};
