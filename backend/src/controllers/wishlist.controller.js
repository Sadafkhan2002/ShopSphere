
"use strict";

const {
  Wishlist,
  WishlistItem,
  Product,
  ProductImage,
} = require("../models");

// Get the authenticated customer's wishlist,
// creating it if it does not exist.
const getOrCreateWishlist = async (userId) => {
  const [wishlist] = await Wishlist.findOrCreate({
    where: { userId },
    defaults: { userId },
  });

  return wishlist;
};

// GET: Retrieve the customer's wishlist
const getWishlist = async (req, res) => {
  try {
    const wishlist = await getOrCreateWishlist(req.user.id);

    const items = await WishlistItem.findAll({
      where: { wishlistId: wishlist.id },
      include: [
        {
          model: Product,
          as: "product",
          include: [
            {
              model: ProductImage,
              as: "images",
              required: false,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Wishlist retrieved successfully.",
      data: {
        wishlistId: wishlist.id,
        items,
        totalItems: items.length,
      },
    });
  } catch (error) {
    console.error("Get wishlist error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve the wishlist.",
    });
  }
};

// POST: Add a product to the customer's wishlist
const addToWishlist = async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    if (!Number.isSafeInteger(productId) || productId < 1) {
      return res.status(400).json({
        success: false,
        message: "A valid product ID is required.",
      });
    }

    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const wishlist = await getOrCreateWishlist(req.user.id);

    const [item, created] = await WishlistItem.findOrCreate({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
      defaults: {
        wishlistId: wishlist.id,
        productId,
      },
    });

    return res.status(created ? 201 : 200).json({
      success: true,
      message: created
        ? "Product added to wishlist successfully."
        : "Product is already in your wishlist.",
      data: {
        item,
      },
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add the product to the wishlist.",
    });
  }
};

// DELETE: Remove a product from the customer's wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    if (!Number.isSafeInteger(productId) || productId < 1) {
      return res.status(400).json({
        success: false,
        message: "A valid product ID is required.",
      });
    }

    const wishlist = await getOrCreateWishlist(req.user.id);

    const item = await WishlistItem.findOne({
      where: {
        wishlistId: wishlist.id,
        productId,
      },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Product is not in your wishlist.",
      });
    }

    await item.destroy();

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist successfully.",
    });
  } catch (error) {
    console.error("Remove from wishlist error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove the product from the wishlist.",
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
