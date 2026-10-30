
"use strict";

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Refund extends Model {}

Refund.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    orderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    processedBy: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "PKR",
    },

    reason: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM("pending", "processed", "failed"),
      allowNull: false,
      defaultValue: "processed",
    },

    isSimulated: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Refund",
    tableName: "refunds",
    timestamps: true,
  }
);

module.exports = Refund;
