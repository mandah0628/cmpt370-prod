const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

class ProfilePhoto extends Model {}

ProfilePhoto.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users", 
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    url: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: true,
      },
    },
  }, {sequelize, modelName: "ProfilePhoto", tableName: "profile_photos", timestamps: true }
);

module.exports = ProfilePhoto;
