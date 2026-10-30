
"use strict";

const { Product, ProductImage } = require("../models");

// ==========================================
// ADMIN: Add an image to an existing product
// ==========================================

const addProductImage = async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    const {
      imageUrl,
      publicId,
      altText,
      isPrimary = false,
      sortOrder = 0,
    } = req.body;

    // Validate product ID
    if (
      !Number.isSafeInteger(productId) ||
      productId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    // Check product existence
    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Validate image URL
    if (
      typeof imageUrl !== "string" ||
      !imageUrl.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required.",
      });
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(imageUrl.trim());
    } catch {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid image URL.",
      });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({
        success: false,
        message: "Image URL must use HTTP or HTTPS.",
      });
    }

    if (imageUrl.trim().length > 2048) {
      return res.status(400).json({
        success: false,
        message: "Image URL is too long.",
      });
    }

    // Validate optional fields
    if (
      publicId !== undefined &&
      publicId !== null &&
      (
        typeof publicId !== "string" ||
        publicId.length > 255
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid public ID.",
      });
    }

    if (
      altText !== undefined &&
      altText !== null &&
      (
        typeof altText !== "string" ||
        altText.length > 255
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid alt text.",
      });
    }

    if (typeof isPrimary !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isPrimary must be a boolean.",
      });
    }

    if (
      !Number.isSafeInteger(sortOrder) ||
      sortOrder < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "sortOrder must be a non-negative integer.",
      });
    }

    // Use a transaction for primary-image changes
    const sequelize = ProductImage.sequelize;

    const image = await sequelize.transaction(
      async (transaction) => {

        // Lock parent product
        await Product.findByPk(productId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        const existingPrimary = await ProductImage.findOne({
          where: {
            productId,
            isPrimary: true,
          },
          transaction,
        });

        // First image becomes primary automatically
        const shouldBePrimary =
          isPrimary || !existingPrimary;

        if (shouldBePrimary) {
          await ProductImage.update(
            { isPrimary: false },
            {
              where: {
                productId,
                isPrimary: true,
              },
              transaction,
            }
          );
        }

        return ProductImage.create(
          {
            productId,
            imageUrl: imageUrl.trim(),
            publicId: publicId ?? null,
            altText: altText ?? null,
            isPrimary: shouldBePrimary,
            sortOrder,
          },
          { transaction }
        );
      }
    );

    return res.status(201).json({
      success: true,
      message: "Product image added successfully.",
      data: { image },
    });

  } catch (error) {
    console.error("Add product image error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add product image.",
    });
  }
};


// ==========================================
// PUBLIC: Retrieve product images
// ==========================================

const getProductImages = async (req, res) => {
  try {
    const productId = Number(req.params.productId);

    if (
      !Number.isSafeInteger(productId) ||
      productId <= 0
    ) {
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

    const images = await ProductImage.findAll({
      where: { productId },
      order: [
        ["sortOrder", "ASC"],
        ["id", "ASC"],
      ],
    });

    return res.status(200).json({
      success: true,
      message: "Product images retrieved successfully.",
      data: { images },
    });

  } catch (error) {
    console.error("Get product images error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve product images.",
    });
  }
};


// ==========================================
// ADMIN: Update an existing product image
// ==========================================

const updateProductImage = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const imageId = Number(req.params.imageId);

    // Validate IDs
    if (
      !Number.isSafeInteger(productId) ||
      productId <= 0 ||
      !Number.isSafeInteger(imageId) ||
      imageId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product or image ID.",
      });
    }

    // Only allow supported fields
    const allowedFields = [
      "imageUrl",
      "publicId",
      "altText",
      "isPrimary",
      "sortOrder",
    ];

    const updates = {};

    for (const key of Object.keys(req.body || {})) {
      if (!allowedFields.includes(key)) {
        return res.status(400).json({
          success: false,
          message: `Field '${key}' cannot be updated.`,
        });
      }

      updates[key] = req.body[key];
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one field to update.",
      });
    }

    // Validate image URL
    if (updates.imageUrl !== undefined) {
      if (
        typeof updates.imageUrl !== "string" ||
        !updates.imageUrl.trim() ||
        updates.imageUrl.trim().length > 2048
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid image URL.",
        });
      }

      try {
        const parsedUrl = new URL(
          updates.imageUrl.trim()
        );

        if (
          !["http:", "https:"].includes(
            parsedUrl.protocol
          )
        ) {
          throw new Error("Invalid protocol");
        }

      } catch {
        return res.status(400).json({
          success: false,
          message:
            "Please provide a valid HTTP/HTTPS image URL.",
        });
      }

      updates.imageUrl = updates.imageUrl.trim();
    }

    // Validate optional text fields
    for (const field of ["publicId", "altText"]) {
      if (
        updates[field] !== undefined &&
        updates[field] !== null &&
        (
          typeof updates[field] !== "string" ||
          updates[field].length > 255
        )
      ) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field}.`,
        });
      }
    }

    // Validate primary status
    if (
      updates.isPrimary !== undefined &&
      typeof updates.isPrimary !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "isPrimary must be a boolean.",
      });
    }

    // Validate sort order
    if (
      updates.sortOrder !== undefined &&
      (
        !Number.isSafeInteger(updates.sortOrder) ||
        updates.sortOrder < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "sortOrder must be a non-negative integer.",
      });
    }

    const sequelize = ProductImage.sequelize;

    const result = await sequelize.transaction(
      async (transaction) => {

        // Lock parent product
        const product = await Product.findByPk(
          productId,
          {
            transaction,
            lock: transaction.LOCK.UPDATE,
          }
        );

        if (!product) {
          return {
            status: 404,
            message: "Product not found.",
          };
        }

        // Find image belonging to this product
        const image = await ProductImage.findOne({
          where: {
            id: imageId,
            productId,
          },
          transaction,
        });

        if (!image) {
          return {
            status: 404,
            message: "Product image not found.",
          };
        }

        // Prevent removing primary status directly
        if (
          updates.isPrimary === false &&
          image.isPrimary
        ) {
          return {
            status: 400,
            message:
              "Promote another image before removing primary status.",
          };
        }

        // Ensure only one primary image per product
        if (updates.isPrimary === true) {
          await ProductImage.update(
            { isPrimary: false },
            {
              where: {
                productId,
                isPrimary: true,
              },
              transaction,
            }
          );
        }

        // Update selected image
        await image.update(updates, {
          transaction,
        });

        return { image };
      }
    );

    if (result.status) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product image updated successfully.",
      data: {
        image: result.image,
      },
    });

  } catch (error) {
    console.error(
      "Update product image error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update product image.",
    });
  }
};


// ==========================================
// Export controllers
// ==========================================
// ADMIN: Delete an image from a product
const deleteProductImage = async (req, res) => {
  try {
    const productId = Number(req.params.productId);
    const imageId = Number(req.params.imageId);

    if (
      !Number.isInteger(productId) ||
      productId <= 0 ||
      !Number.isInteger(imageId) ||
      imageId <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID or image ID.",
      });
    }

    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const image = await ProductImage.findOne({
      where: {
        id: imageId,
        productId: productId,
      },
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Product image not found.",
      });
    }

    await image.destroy();

    return res.status(200).json({
      success: true,
      message: "Product image deleted successfully.",
    });
  } catch (error) {
    console.error("Delete product image error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete product image.",
    });
  }
};

module.exports = {
  addProductImage,
  getProductImages,
  updateProductImage,
  deleteProductImage,
};
