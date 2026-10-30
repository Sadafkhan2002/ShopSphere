
"use strict";

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Coupon extends Model {}

Coupon.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 50],
      },
      set(value) {
        this.setDataValue("code", value.trim().toUpperCase());
      },
    },

    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },

    discountType: {
      type: DataTypes.ENUM("percentage", "fixed"),
      allowNull: false,
    },

    discountValue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },

    minimumOrderAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    maximumDiscountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    usageLimit: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },

    usedCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },

    perUserLimit: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },

    startsAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "Coupon",
    tableName: "coupons",
    timestamps: true,
    underscored: false,
  }
);

module.exports = Coupon;
