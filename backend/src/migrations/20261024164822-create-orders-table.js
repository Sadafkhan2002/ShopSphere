"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("orders", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      orderNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },

      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      status: {
        type: Sequelize.ENUM(
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
      },

      subtotal: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },

      shippingFee: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },

      discountAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },

      taxAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },

      totalAmount: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },

      currency: {
        type: Sequelize.STRING(3),
        allowNull: false,
        defaultValue: "PKR",
      },

      paymentStatus: {
        type: Sequelize.ENUM(
          "pending",
          "paid",
          "failed",
          "refunded",
          "partially_refunded"
        ),
        allowNull: false,
        defaultValue: "pending",
      },

      shippingFullName: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },

      shippingPhone: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },

      shippingAddressLine1: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      shippingAddressLine2: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      shippingCity: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      shippingState: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      shippingPostalCode: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },

      shippingCountry: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      placedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal(
          "CURRENT_TIMESTAMP"
        ),
      },
    });

    await queryInterface.addIndex("orders", ["userId"]);
    await queryInterface.addIndex("orders", ["status"]);
    await queryInterface.addIndex("orders", ["paymentStatus"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("orders");
  },
};