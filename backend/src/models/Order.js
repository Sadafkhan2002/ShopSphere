
"use strict";

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class Order extends Model {}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
      field: "id",
    },
    orderNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: "orderNumber",
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "userId",
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded"
      ),
      allowNull: false,
      defaultValue: "pending",
      field: "status",
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "subtotal",
    },
    shippingFee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "shippingFee",
    },
    discountAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "discountAmount",
    },
    taxAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "taxAmount",
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "totalAmount",
    },
    currency: {
      type: DataTypes.STRING(3),
      allowNull: false,
      defaultValue: "PKR",
      field: "currency",
    },
    paymentStatus: {
      type: DataTypes.ENUM(
        "pending",
        "paid",
        "failed",
        "refunded",
        "partially_refunded"
      ),
      allowNull: false,
      defaultValue: "pending",
      field: "paymentStatus",
    },
    safepayTrackerId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      field: "safepayTrackerId",
    },
    shippingFullName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "shippingFullName",
    },
    shippingPhone: {
      type: DataTypes.STRING(30),
      allowNull: false,
      field: "shippingPhone",
    },
    shippingAddressLine1: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "shippingAddressLine1",
    },
    shippingAddressLine2: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "shippingAddressLine2",
    },
    shippingCity: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "shippingCity",
    },
    shippingState: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "shippingState",
    },
    shippingPostalCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: "shippingPostalCode",
    },
    shippingCountry: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "shippingCountry",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "notes",
    },
    placedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "placedAt",
    },
  },
  {
    sequelize,
    modelName: "Order",
    tableName: "orders",
    timestamps: true,
    underscored: false,
    createdAt: "createdAt",
    updatedAt: "updatedAt",
  }
);

module.exports = Order;
