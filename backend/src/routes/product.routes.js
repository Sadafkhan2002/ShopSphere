
"use strict";

const express = require("express");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getInventory,
  adjustProductStock,
} = require("../controllers/product.controller");

const { authenticate } = require("../middleware/auth.middleware");
const { authorizeRoles } = require("../middleware/authorize.middleware");

const router = express.Router();

// Public: list active products.
router.get("/", getProducts);

// Admin only: view inventory and stock summaries.
router.get(
  "/admin/inventory",
  authenticate,
  authorizeRoles("admin"),
  getInventory
);

// Public: retrieve one active product.
router.get("/:id", getProductById);

// Admin only: create a product.
router.post(
  "/",
  authenticate,
  authorizeRoles("admin"),
  createProduct
);

// Admin only: update a product.
router.put(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  updateProduct
);

// Admin only: manually increase or decrease product stock.
router.patch(
  "/:id/stock",
  authenticate,
  authorizeRoles("admin"),
  adjustProductStock
);

// Admin only: deactivate a product.
router.delete(
  "/:id",
  authenticate,
  authorizeRoles("admin"),
  deleteProduct
);

module.exports = router;
