const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

// Debug log to see what's happening
console.log("Loading Conversation model with nullable listingId");

class Conversation extends Model{}

Conversation.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        listingId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: "listings",
                key: "id"
            },
            onDelete: "CASCADE"
        },

        buyerId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id"
            },
            onDelete: "CASCADE"
        },

        sellerId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id"
            },
            onDelete: "CASCADE"
        },

        lastMessagedAt: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, { sequelize, modelName: "Conversation", tableName: "conversations", timestamps: true }
);

module.exports = Conversation;