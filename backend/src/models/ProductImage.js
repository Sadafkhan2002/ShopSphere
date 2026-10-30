
"use strict";

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class ProductImage extends Model {}

ProductImage.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "product_id",
      references: {
        model: "products",
        key: "id",
      },
    },

    imageUrl: {
      type: DataTypes.STRING(2048),
      allowNull: false,
      field: "image_url",
      validate: {
        notEmpty: true,
        isUrl: true,
      },
    },

    publicId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "public_id",
    },

    altText: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "alt_text",
    },

    isPrimary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_primary",
    },

    sortOrder: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: "sort_order",
      validate: {
        min: 0,
      },
    },
  },
  {
    sequelize,
    modelName: "ProductImage",
    tableName: "product_images",
    timestamps: true,
    underscored: true,
  }
);

module.exports = ProductImage;
