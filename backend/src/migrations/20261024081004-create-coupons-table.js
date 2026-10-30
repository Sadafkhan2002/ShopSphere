
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("coupons", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },

      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      discountType: {
        type: Sequelize.ENUM("percentage", "fixed"),
        allowNull: false,
      },

      discountValue: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },

      minimumOrderAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },

      maximumDiscountAmount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },

      usageLimit: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      },

      usedCount: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },

      perUserLimit: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 1,
      },

      startsAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("coupons");
  },
};
