const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

class ListingImage extends Model {}

ListingImage.init(
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

    mainImage: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    url: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true,
      },
    },
  }, { sequelize, modelName: "ListingImage", tableName: "listing_images", timestamps: true }
);


module.exports = ListingImage;
