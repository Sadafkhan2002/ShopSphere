
"use strict";

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Wishlist extends Model {}

Wishlist.init(
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
    modelName: "Wishlist",
    tableName: "wishlists",
    timestamps: true,
    underscored: false,
  }
);

module.exports = Wishlist;
