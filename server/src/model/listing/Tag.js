const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

class Tag extends Model {}

Tag.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    listingId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "listings", 
        key: "id",
      },
      onDelete: "CASCADE",
    },

    tag: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, { sequelize, modelName: "Tag", tableName: "tags" }
);

module.exports = Tag;
