
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("reviews", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
          model: "users",
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
        onDelete: "CASCADE",
      },

      rating: {
        type: Sequelize.TINYINT.UNSIGNED,
        allowNull: false,
      },

      title: {
        type: Sequelize.STRING(150),
        allowNull: true,
      },

      comment: {
        type: Sequelize.TEXT,
        allowNull: true,
      },

      isApproved: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

    await queryInterface.addIndex("reviews", ["userId", "productId"], {
      unique: true,
      name: "reviews_user_product_unique",
    });

    await queryInterface.addIndex("reviews", ["productId"], {
      name: "reviews_product_id_index",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("reviews");
  },
};
