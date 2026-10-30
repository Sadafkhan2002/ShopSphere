
"use strict";

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class OrderItem extends Model {}

OrderItem.init(
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

    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    productName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },

    productSku: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      validate: {
        min: 1,
      },
    },

    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },

    lineTotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "OrderItem",
    tableName: "order_items",
    timestamps: true,
  }
);

module.exports = OrderItem;
