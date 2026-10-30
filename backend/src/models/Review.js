
"use strict";

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Review extends Model {}

Review.init(
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
    },

    productId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    rating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
        isInt: true,
      },
    },

    title: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },

    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    isApproved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "Review",
    tableName: "reviews",
    timestamps: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ["userId", "productId"],
      },
      {
        fields: ["productId"],
      },
    ],
  }
);

module.exports = Review;
