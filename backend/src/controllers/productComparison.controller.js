
"use strict";

const {
  Product,
  ProductImage,
  ProductComparison,
  ProductComparisonItem,
} = require("../models");

const MAX_COMPARISON_ITEMS = 4;

// Find or create the logged-in customer's comparison list
const getOrCreateComparison = async (userId) => {
  const [comparison] = await ProductComparison.findOrCreate({
    where: { userId },
    defaults: { userId },
  });

  return comparison;
};

// GET: Retrieve comparison list
const getComparison = async (req, res) => {
  try {
    const comparison = await getOrCreateComparison(req.user.id);

    const items = await ProductComparisonItem.findAll({
      where: { comparisonId: comparison.id },
      include: [
        {
          model: Product,
          as: "product",
          include: [
            {
              model: ProductImage,
              as: "images",
            },
          ],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Product comparison retrieved successfully.",
      data: {
        comparisonId: comparison.id,
        items,
        totalItems: items.length,
        maxItems: MAX_COMPARISON_ITEMS,
      },
    });
  } catch (error) {
    console.error("Get comparison error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve product comparison.",
    });
  }
};

// POST: Add product to comparison
const addToComparison = async (req, res) => {
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

    const comparison = await getOrCreateComparison(req.user.id);

    const existingItem = await ProductComparisonItem.findOne({
      where: {
        comparisonId: comparison.id,
        productId,
      },
    });

    if (existingItem) {
      return res.status(200).json({
        success: true,
        message: "Product is already in your comparison list.",
        data: existingItem,
      });
    }

    const totalItems = await ProductComparisonItem.count({
      where: { comparisonId: comparison.id },
    });

    if (totalItems >= MAX_COMPARISON_ITEMS) {
      return res.status(400).json({
        success: false,
        message: `You can compare a maximum of ${MAX_COMPARISON_ITEMS} products.`,
      });
    }

    const item = await ProductComparisonItem.create({
      comparisonId: comparison.id,
      productId,
    });

    return res.status(201).json({
      success: true,
      message: "Product added to comparison successfully.",
      data: item,
    });
  } catch (error) {
    console.error("Add comparison error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add product to comparison.",
    });
  }
};

// DELETE: Remove a particular product
const removeFromComparison = async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const comparison = await ProductComparison.findOne({
      where: { userId: req.user.id },
    });

    if (!comparison) {
      return res.status(404).json({
        success: false,
        message: "Comparison list not found.",
      });
    }

    const item = await ProductComparisonItem.findOne({
      where: {
        comparisonId: comparison.id,
        productId,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product is not in your comparison list.",
      });
    }

    await item.destroy();

    return res.status(200).json({
      success: true,
      message: "Product removed from comparison successfully.",
    });
  } catch (error) {
    console.error("Remove comparison error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to remove product from comparison.",
    });
  }
};

// DELETE: Clear comparison list
const clearComparison = async (req, res) => {
  try {
    const comparison = await ProductComparison.findOne({
      where: { userId: req.user.id },
    });

    if (!comparison) {
      return res.status(200).json({
        success: true,
        message: "Comparison list is already empty.",
      });
    }

    await ProductComparisonItem.destroy({
      where: { comparisonId: comparison.id },
    });

    return res.status(200).json({
      success: true,
      message: "Comparison list cleared successfully.",
    });
  } catch (error) {
    console.error("Clear comparison error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to clear comparison list.",
    });
  }
};

module.exports = {
  getComparison,
  addToComparison,
  removeFromComparison,
  clearComparison,
};
