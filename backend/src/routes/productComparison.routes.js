
"use strict";

const express = require("express");
const router = express.Router();

const {
  getComparison,
  addToComparison,
  removeFromComparison,
  clearComparison,
} = require("../controllers/productComparison.controller");

// Use the same authentication middleware as your cart routes.
const { authenticate } = require("../middleware/auth.middleware");

// All comparison endpoints require login.
router.use(authenticate);

// GET: Retrieve the logged-in customer's comparison list
router.get("/", getComparison);

// POST: Add a product
router.post("/:productId", addToComparison);

// DELETE: Clear the whole comparison list.
// Keep this route before /:productId for clarity.
router.delete("/clear", clearComparison);

// DELETE: Remove a particular product
router.delete("/:productId", removeFromComparison);

module.exports = router;
