
"use strict";

const express = require("express");
const router = express.Router();

const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cart.controller");

const { authenticate } = require("../middleware/auth.middleware");
// All cart routes require an authenticated user.
router.use(authenticate);

// GET: View the current user's cart
router.get("/", getCart);

// POST: Add a product to the cart
router.post("/items", addToCart);

// PATCH: Update a cart item's quantity
router.patch("/items/:itemId", updateCartItem);

// DELETE: Remove an item from the cart
router.delete("/items/:itemId", removeCartItem);
router.delete("/", clearCart);

module.exports = router;
