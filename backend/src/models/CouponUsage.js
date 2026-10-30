
"use strict";

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class CouponUsage extends Model {}

CouponUsage.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    couponId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },

    orderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
    },

    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },

    usedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "CouponUsage",
    tableName: "coupon_usages",
    timestamps: true,
    underscored: false,
    indexes: [
      {
        fields: ["couponId", "userId"],
      },
    ],
  }
);

module.exports = CouponUsage;
