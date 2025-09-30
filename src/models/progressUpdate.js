const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProgressUpdate = sequelize.define(
    "ProgressUpdate",
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
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      progress_percent: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 0,
          max: 100,
        },
      },
      images: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    },
    {
      tableName: "progress_updates",
      timestamps: true,
    }
  );

  return ProgressUpdate;
};
