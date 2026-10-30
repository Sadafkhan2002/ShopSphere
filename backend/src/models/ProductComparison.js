
"use strict";

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class ProductComparison extends Model {}

ProductComparison.init(
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
    modelName: "ProductComparison",
    tableName: "product_comparisons",
    timestamps: true,
    underscored: false,
  }
);

module.exports = ProductComparison;
