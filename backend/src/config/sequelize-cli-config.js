
require("dotenv").config();

const config = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  dialect: "mysql",
  logging: false,
};

module.exports = {
  development: { ...config },
  test: {
    ...config,
    database: process.env.DB_NAME_TEST || "shopsphere_test_db",
  },
  production: {
    ...config,
    database: process.env.DB_NAME_PRODUCTION,
  },
};
