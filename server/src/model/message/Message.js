const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

class Message extends Model{}

Message.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        conversationId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "conversations",
                key: "id"
            },
            onDelete: "CASCADE"
        },

        senderId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id"
            },
            onDelete: "CASCADE"
        },

        text: {
            type: DataTypes.TEXT,
            allowNull: false
        }
    }, { sequelize, modelName: "Message", tableName: "messages", timestamps: true }
);

module.exports = Message;
