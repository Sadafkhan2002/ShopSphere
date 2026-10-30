
"use strict";

const express = require("express");
const router = express.Router();

const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlist.controller");

const { authenticate } = require("../middleware/auth.middleware");

// All wishlist endpoints require authentication.
router.use(authenticate);

router.get("/", getWishlist);

router.post("/:productId", addToWishlist);

router.delete("/:productId", removeFromWishlist);

module.exports = router;
