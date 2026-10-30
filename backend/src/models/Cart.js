
"use strict";

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Cart extends Model {}

Cart.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: "Cart",
    tableName: "carts",
    timestamps: true,
    underscored: false,
  }
);

module.exports = Cart;
