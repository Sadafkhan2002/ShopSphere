
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("order_items", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      orderId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "orders",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      productId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT",
      },

      productName: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },

      productSku: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },

      quantity: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
      },

      unitPrice: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },

      lineTotal: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });

    await queryInterface.addIndex("order_items", ["orderId"]);
    await queryInterface.addIndex("order_items", ["productId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("order_items");
  },
};
