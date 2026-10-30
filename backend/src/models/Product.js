
"use strict";

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Product extends Model {}

Product.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    categoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "category_id",
      references: {
        model: "categories",
        key: "id",
      },
    },

    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 150],
      },
    },

    slug: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 180],
      },
      set(value) {
        this.setDataValue(
          "slug",
          typeof value === "string" ? value.trim().toLowerCase() : value
        );
      },
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [2, 100],
      },
      set(value) {
        this.setDataValue(
          "sku",
          typeof value === "string" ? value.trim().toUpperCase() : value
        );
      },
    },

    price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0.01,
      },
    },

    compareAtPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      field: "compare_at_price",
      validate: {
        isDecimal: true,
        min: 0,
      },
    },

    stockQuantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: "stock_quantity",
      validate: {
        min: 0,
      },
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active",
    },
  },
  {
    sequelize,
    modelName: "Product",
    tableName: "products",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Product;
