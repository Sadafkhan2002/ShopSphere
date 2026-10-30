
"use strict";

const express = require("express");

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");

const { authenticate } = require("../middleware/auth.middleware");

const {
  authorizeRoles,
} = require("../middleware/authorize.middleware");

const router = express.Router();

// Public: list active categories
router.get("/", getCategories);

// Public: get one active category
router.get("/:id", getCategoryById);

// Admin only: create a category
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  createCategory
);

// Admin only: update a category
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  updateCategory
);

// Admin only: delete a category
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  deleteCategory
);

module.exports = router;
