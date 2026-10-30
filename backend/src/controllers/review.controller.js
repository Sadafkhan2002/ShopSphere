
"use strict";

const {
  Review,
  Product,
  User,
} = require("../models");

// GET approved reviews for a product
const getProductReviews = async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const reviews = await Review.findAll({
      where: {
        productId,
        isApproved: true,
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews === 0
        ? 0
        : Number(
            (
              reviews.reduce((sum, review) => sum + review.rating, 0) /
              totalReviews
            ).toFixed(2)
          );

    return res.status(200).json({
      success: true,
      message: "Product reviews retrieved successfully.",
      data: {
        productId,
        reviews,
        totalReviews,
        averageRating,
      },
    });
  } catch (error) {
    console.error("Get product reviews error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve product reviews.",
    });
  }
};

// POST a review for a product
const createReview = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const userId = req.user.id;
    const { rating, title, comment } = req.body;

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findByPk(productId);

    if (!product || !product.isActive) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (
      rating === undefined ||
      rating === null ||
      rating === "" ||
      !Number.isInteger(Number(rating)) ||
      Number(rating) < 1 ||
      Number(rating) > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5.",
      });
    }

    if (
      title !== undefined &&
      title !== null &&
      (typeof title !== "string" || title.trim().length > 150)
    ) {
      return res.status(400).json({
        success: false,
        message: "Review title must be a string of at most 150 characters.",
      });
    }

    if (
      comment !== undefined &&
      comment !== null &&
      typeof comment !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Review comment must be a string.",
      });
    }

    const existingReview = await Review.findOne({
      where: { userId, productId },
    });

    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this product.",
      });
    }

    const review = await Review.create({
      userId,
      productId,
      rating: Number(rating),
      title: title?.trim() || null,
      comment: comment?.trim() || null,
      isApproved: false,
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully and is awaiting approval.",
      data: { review },
    });
  } catch (error) {
    console.error("Create review error:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this product.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to submit review.",
    });
  }
};

// PUT: update the authenticated user's own review
const updateReview = async (req, res) => {
  try {
    const reviewId = Number(req.params.reviewId);
    const userId = req.user.id;
    const { rating, title, comment } = req.body;

    if (!Number.isSafeInteger(reviewId) || reviewId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID.",
      });
    }

    const review = await Review.findOne({
      where: { id: reviewId, userId },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    if (
      rating !== undefined &&
      (
        rating === null ||
        rating === "" ||
        !Number.isInteger(Number(rating)) ||
        Number(rating) < 1 ||
        Number(rating) > 5
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Rating must be an integer between 1 and 5.",
      });
    }

    if (
      title !== undefined &&
      title !== null &&
      (typeof title !== "string" || title.trim().length > 150)
    ) {
      return res.status(400).json({
        success: false,
        message: "Review title must be a string of at most 150 characters.",
      });
    }

    if (
      comment !== undefined &&
      comment !== null &&
      typeof comment !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Review comment must be a string.",
      });
    }

    if (rating !== undefined) {
      review.rating = Number(rating);
    }

    if (title !== undefined) {
      review.title = title?.trim() || null;
    }

    if (comment !== undefined) {
      review.comment = comment?.trim() || null;
    }

    // Updated reviews must be approved again before becoming public.
    review.isApproved = false;

    await review.save();

    return res.status(200).json({
      success: true,
      message: "Review updated successfully and is awaiting approval.",
      data: { review },
    });
  } catch (error) {
    console.error("Update review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update review.",
    });
  }
};

// DELETE: delete the authenticated user's own review
const deleteReview = async (req, res) => {
  try {
    const reviewId = Number(req.params.reviewId);
    const userId = req.user.id;

    if (!Number.isSafeInteger(reviewId) || reviewId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid review ID.",
      });
    }

    const review = await Review.findOne({
      where: { id: reviewId, userId },
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    await review.destroy();

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error("Delete review error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete review.",
    });
  }
};

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
};
