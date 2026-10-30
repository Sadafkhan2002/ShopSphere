
"use strict";

const express = require("express");

const {
  addProductImage,
  getProductImages,
  updateProductImage,
  deleteProductImage,
} = require("../controllers/productImage.controller");

const {
  authenticate,
} = require("../middleware/auth.middleware");

const {
  authorizeRoles,
} = require("../middleware/authorize.middleware");

const router = express.Router();

// PUBLIC: Retrieve product images
router.get("/:productId/images", getProductImages);

// ADMIN: Add product image
router.post(
  "/:productId/images",
  authenticate,
  authorizeRoles("admin"),
  addProductImage
);

// ADMIN: Update existing product image
router.patch(
  "/:productId/images/:imageId",
  authenticate,
  authorizeRoles("admin"),
  updateProductImage
);

// ADMIN: Delete existing product image
router.delete(
  "/:productId/images/:imageId",
  authenticate,
  authorizeRoles("admin"),
  deleteProductImage
);

module.exports = router;
