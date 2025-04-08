const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../config/database"); 

class UserReview extends Model {}

UserReview.init(
  {
    // Primary key
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    
    // The user being reviewed
    revieweeId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },

    // The user writing the review
    reviewerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    // 0–5 rating (allow half increments)
    rating: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
        max: 5
      }
    },

    // Up to 250 chars
    comment: {
      type: DataTypes.STRING(250),
      allowNull: true
    }
    
  }, { sequelize, modelName: "UserReview", tableName: "userReviews", timestamps: true }
);

module.exports = UserReview;
