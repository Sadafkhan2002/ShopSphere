
"use strict";

const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/database");

class User extends Model {}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "first_name",
      validate: {
        notEmpty: true,
      },
    },

    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "last_name",
      validate: {
        notEmpty: true,
      },
    },

    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
      set(value) {
        this.setDataValue(
          "email",
          typeof value === "string"
            ? value.trim().toLowerCase()
            : value
        );
      },
    },

    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "password_hash",
    },

    role: {
      type: DataTypes.ENUM("customer", "admin"),
      allowNull: false,
      defaultValue: "customer",
    },

    authProvider: {
      type: DataTypes.ENUM("local", "google"),
      allowNull: false,
      defaultValue: "local",
      field: "auth_provider",
    },

    googleId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: "google_id",
    },

    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },

    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_active",
    },

    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_email_verified",
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    underscored: true,
  }
);

module.exports = User;
