"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("orders", "safepayTrackerId", {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("orders", "safepayTrackerId");
  },
};