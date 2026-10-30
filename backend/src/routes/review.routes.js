
"use strict";

const express = require("express");
const router = express.Router();

const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
} = require("../controllers/review.controller");

const { authenticate } = require("../middleware/auth.middleware");

// Public: retrieve approved reviews for a product
router.get("/products/:productId/reviews", getProductReviews);

// Customer: submit a review
router.post(
  "/products/:productId/reviews",
  authenticate,
  createReview
);

// Customer: update their own review
router.put(
  "/customer/reviews/:reviewId",
  authenticate,
  updateReview
);

// Customer: delete their own review
router.delete(
  "/customer/reviews/:reviewId",
  authenticate,
  deleteReview
);

module.exports = router;
