
"use strict";

require("dotenv").config();

const sequelize = require("../src/config/database");
const User = require("../src/models/User");

async function makeAdmin() {
  try {
    const email = process.argv[2]?.trim().toLowerCase();

    if (!email) {
      console.error(
        "Usage: node scripts/make-admin.js your-email@example.com"
      );
      process.exitCode = 1;
      return;
    }

    await sequelize.authenticate();

    const user = await User.findOne({ where: { email } });

    if (!user) {
      console.error("User not found. Register this account first.");
      process.exitCode = 1;
      return;
    }

    if (user.role === "admin") {
      console.log("This account is already an admin.");
      return;
    }

    user.role = "admin";
    await user.save();

    console.log(`Admin role assigned successfully to ${user.email}.`);
  } catch (error) {
    console.error("Unable to assign admin role:", error.message);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

makeAdmin();
