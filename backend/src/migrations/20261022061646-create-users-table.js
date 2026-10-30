
"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("users", {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },

      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },

      role: {
        type: Sequelize.ENUM("customer", "admin"),
        allowNull: false,
        defaultValue: "customer",
      },

      auth_provider: {
        type: Sequelize.ENUM("local", "google"),
        allowNull: false,
        defaultValue: "local",
      },

      google_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
      },

      phone: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },

      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      is_email_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },

      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("users");
  },
};
