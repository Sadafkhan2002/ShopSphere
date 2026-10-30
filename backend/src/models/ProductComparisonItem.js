
"use strict";

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class ProductComparisonItem extends Model {}

ProductComparisonItem.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    comparisonId: {
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
    modelName: "ProductComparisonItem",
    tableName: "product_comparison_items",
    timestamps: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ["comparisonId", "productId"],
      },
    ],
  }
);

module.exports = ProductComparisonItem;
