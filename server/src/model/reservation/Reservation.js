const { Model, DataTypes } = require("sequelize");
const sequelize = require("../../config/database");

class Reservation extends Model{}

Reservation.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },

        listingId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "listings",
                key: "id"
            },
            onDelete: "CASCADE"
        },

        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: {
                model: "users",
                key: "id"
            },
            onDelete: "CASCADE"
        },

        startDate: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },

        endDate: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },

        totalPrice: {
            type: DataTypes.FLOAT,
            allowNull:false
        },

        status: {
            type: DataTypes.ENUM("cancelled", "ongoing", "complete", "pending"),
            defaultValue: "pending",
            allowNull: false
        }
    }, { sequelize, tableName: "reservations", modelName: "Reservation", timestamps: true }
);

module.exports = Reservation;