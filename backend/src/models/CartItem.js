
"use strict";

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class CartItem extends Model {}

CartItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    cartId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    quantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
      },
    },
  },
  {
    sequelize,
    modelName: "CartItem",
    tableName: "cart_items",
    timestamps: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ["cartId", "productId"],
      },
    ],
  }
);

module.exports = CartItem;
