
"use strict";

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class WishlistItem extends Model {}

WishlistItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    wishlistId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "WishlistItem",
    tableName: "wishlist_items",
    timestamps: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ["wishlistId", "productId"],
      },
    ],
  }
);

module.exports = WishlistItem;
