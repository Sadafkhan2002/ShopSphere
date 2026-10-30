
"use strict";
const { Category, Product } = require("../models");
const sequelize = Product.sequelize;
const { Op } = require("sequelize");

const createProduct = async (req, res) => {
  try {
    const {
      categoryId,
      name,
      slug,
      description,
      sku,
      price,
      compareAtPrice,
      stockQuantity,
    } = req.body;

    // Validate required fields.
    if (
      categoryId === undefined ||
      name === undefined ||
      slug === undefined ||
      sku === undefined ||
      price === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "categoryId, name, slug, sku, and price are required.",
      });
    }

    // Validate category ID.
    if (
      !Number.isSafeInteger(Number(categoryId)) ||
      Number(categoryId) < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "categoryId must be a positive integer.",
      });
    }

    // Validate text fields.
    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 150
    ) {
      return res.status(400).json({
        success: false,
        message: "Product name must be between 2 and 150 characters.",
      });
    }

    if (
      typeof slug !== "string" ||
      slug.trim().length < 2 ||
      slug.trim().length > 180 ||
      !/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(slug.trim())
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Slug must contain letters or numbers separated by single hyphens.",
      });
    }

    if (
      typeof sku !== "string" ||
      sku.trim().length < 2 ||
      sku.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "SKU must be between 2 and 100 characters.",
      });
    }

    // Validate price without accepting non-numeric values.
    const normalizedPrice =
      typeof price === "number" || typeof price === "string"
        ? String(price).trim()
        : "";

    if (
      !/^\d+(?:\.\d{1,2})?$/.test(normalizedPrice) ||
      !Number.isFinite(Number(normalizedPrice)) ||
      Number(normalizedPrice) <= 0 ||
      Number(normalizedPrice) >= 10000000000
    ) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number with at most 2 decimal places.",
      });
    }

    // Validate optional comparison price.
    let normalizedCompareAtPrice = null;

    if (compareAtPrice !== undefined && compareAtPrice !== null && compareAtPrice !== "") {
      const value =
        typeof compareAtPrice === "number" ||
        typeof compareAtPrice === "string"
          ? String(compareAtPrice).trim()
          : "";

      if (
        !/^\d+(?:\.\d{1,2})?$/.test(value) ||
        !Number.isFinite(Number(value)) ||
        Number(value) < 0 ||
        Number(value) >= 10000000000
      ) {
        return res.status(400).json({
          success: false,
          message: "compareAtPrice must be a non-negative number with at most 2 decimal places.",
        });
      }

      normalizedCompareAtPrice = value;
    }

    // Validate stock quantity.
    let normalizedStockQuantity = 0;

    if (stockQuantity !== undefined) {
      if (
        !(
          typeof stockQuantity === "number" ||
          (typeof stockQuantity === "string" &&
            /^\d+$/.test(stockQuantity.trim()))
        ) ||
        !Number.isSafeInteger(Number(stockQuantity)) ||
        Number(stockQuantity) < 0 ||
        Number(stockQuantity) > 4294967295
      ) {
        return res.status(400).json({
          success: false,
          message: "stockQuantity must be a non-negative integer.",
        });
      }

      normalizedStockQuantity = Number(stockQuantity);
    }

    // Validate optional description.
    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be a string or null.",
      });
    }

    // Confirm that the category exists and is active.
    const category = await Category.findOne({
      where: {
        id: Number(categoryId),
        isActive: true,
      },
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "The selected category does not exist or is inactive.",
      });
    }

    // Create the product.
    const product = await Product.create({
      categoryId: Number(categoryId),
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description:
        typeof description === "string" && description.trim()
          ? description.trim()
          : null,
      sku: sku.trim().toUpperCase(),
      price: normalizedPrice,
      compareAtPrice: normalizedCompareAtPrice,
      stockQuantity: normalizedStockQuantity,
    });

    return res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: { product },
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "A product with this slug or SKU already exists.",
      });
    }

    if (
      error.name === "SequelizeForeignKeyConstraintError" ||
      error.name === "SequelizeValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message: "Product data is invalid.",
      });
    }

    console.error("Create product error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create product.",
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const {
      page = "1",
      limit = "10",
      search,
      categoryId,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      order = "DESC",
    } = req.query;

    // Validate pagination.
    if (
      !/^[1-9]\d*$/.test(page) ||
      !/^[1-9]\d*$/.test(limit) ||
      Number(page) > 1000000 ||
      Number(limit) > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 50.",
      });
    }

    // Validate search text.
    if (
      search !== undefined &&
      (typeof search !== "string" ||
        search.trim().length === 0 ||
        search.trim().length > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Search must contain 1 to 100 characters.",
      });
    }

    // Validate category ID.
    if (
      categoryId !== undefined &&
      (!/^[1-9]\d*$/.test(categoryId) ||
        !Number.isSafeInteger(Number(categoryId)))
    ) {
      return res.status(400).json({
        success: false,
        message: "categoryId must be a positive integer.",
      });
    }

    // Validate price filters.
    const isValidPrice = (value) =>
      /^\d+(?:\.\d{1,2})?$/.test(value) &&
      Number.isFinite(Number(value)) &&
      Number(value) < 10000000000;

    if (
      (minPrice !== undefined && !isValidPrice(minPrice)) ||
      (maxPrice !== undefined && !isValidPrice(maxPrice))
    ) {
      return res.status(400).json({
        success: false,
        message: "Price filters must be non-negative numbers with at most 2 decimal places.",
      });
    }

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      Number(minPrice) > Number(maxPrice)
    ) {
      return res.status(400).json({
        success: false,
        message: "minPrice cannot be greater than maxPrice.",
      });
    }

    // Allow only supported sorting fields.
    const allowedSortFields = ["createdAt", "price", "name"];

    if (
      !allowedSortFields.includes(sortBy) ||
      !["ASC", "DESC"].includes(order)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid sorting options.",
      });
    }

    const pageNumber = Number(page);
    const pageSize = Number(limit);
    const offset = (pageNumber - 1) * pageSize;

    // Always show active products only.
    const productWhere = {
      isActive: true,
    };

    // Search product name, slug, or description.
    if (search !== undefined) {
      const searchTerm = search.trim();

      productWhere[Op.or] = [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { slug: { [Op.like]: `%${searchTerm}%` } },
        { description: { [Op.like]: `%${searchTerm}%` } },
      ];
    }

    // Apply price range.
    if (minPrice !== undefined || maxPrice !== undefined) {
      productWhere.price = {};

      if (minPrice !== undefined) {
        productWhere.price[Op.gte] = minPrice;
      }

      if (maxPrice !== undefined) {
        productWhere.price[Op.lte] = maxPrice;
      }
    }

    // Include only active categories and optionally filter by category ID.
    const categoryWhere = {
      isActive: true,
    };

    if (categoryId !== undefined) {
      categoryWhere.id = Number(categoryId);
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: productWhere,
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "slug"],
          where: categoryWhere,
          required: true,
        },
      ],
      attributes: [
        "id",
        "categoryId",
        "name",
        "slug",
        "description",
        "sku",
        "price",
        "compareAtPrice",
        "stockQuantity",
        "isActive",
        "createdAt",
      ],
      order: [[sortBy, order]],
      limit: pageSize,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      message: "Products retrieved successfully.",
      data: {
        products,
        pagination: {
          totalProducts: count,
          currentPage: pageNumber,
          pageSize,
          totalPages: Math.ceil(count / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Get products error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve products.",
    });
  }
};


const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate the product ID.
    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findOne({
      where: {
        id: Number(id),
        isActive: true,
      },
      attributes: [
        "id",
        "categoryId",
        "name",
        "slug",
        "description",
        "sku",
        "price",
        "compareAtPrice",
        "stockQuantity",
        "isActive",
        "createdAt",
      ],
      include: [
        {
          model: Category,
          as: "category",
          attributes: ["id", "name", "slug", "description"],
          where: {
            isActive: true,
          },
          required: true,
        },
      ],
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product retrieved successfully.",
      data: { product },
    });
  } catch (error) {
    console.error("Get product by ID error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve product details.",
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findByPk(Number(id));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const {
      categoryId,
      name,
      slug,
      description,
      sku,
      price,
      compareAtPrice,
      stockQuantity,
      isActive,
    } = req.body;

    const updates = {};

    if (categoryId !== undefined) {
      if (
        !Number.isSafeInteger(Number(categoryId)) ||
        Number(categoryId) < 1
      ) {
        return res.status(400).json({
          success: false,
          message: "categoryId must be a positive integer.",
        });
      }

      const category = await Category.findOne({
        where: { id: Number(categoryId), isActive: true },
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          message: "The selected category does not exist or is inactive.",
        });
      }

      updates.categoryId = Number(categoryId);
    }

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        name.trim().length < 2 ||
        name.trim().length > 150
      ) {
        return res.status(400).json({
          success: false,
          message: "Product name must be between 2 and 150 characters.",
        });
      }

      updates.name = name.trim();
    }

    if (slug !== undefined) {
      if (
        typeof slug !== "string" ||
        slug.trim().length < 2 ||
        slug.trim().length > 180 ||
        !/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(slug.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Product slug is invalid.",
        });
      }

      updates.slug = slug.trim().toLowerCase();
    }

    if (sku !== undefined) {
      if (
        typeof sku !== "string" ||
        sku.trim().length < 2 ||
        sku.trim().length > 100
      ) {
        return res.status(400).json({
          success: false,
          message: "SKU must be between 2 and 100 characters.",
        });
      }

      updates.sku = sku.trim().toUpperCase();
    }

    if (description !== undefined) {
      if (
        description !== null &&
        typeof description !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message: "Description must be a string or null.",
        });
      }

      updates.description =
        typeof description === "string" && description.trim()
          ? description.trim()
          : null;
    }

    if (price !== undefined) {
      const value =
        typeof price === "number" || typeof price === "string"
          ? String(price).trim()
          : "";

      if (
        !/^\d+(?:\.\d{1,2})?$/.test(value) ||
        !Number.isFinite(Number(value)) ||
        Number(value) <= 0 ||
        Number(value) >= 10000000000
      ) {
        return res.status(400).json({
          success: false,
          message: "Price must be positive with at most 2 decimal places.",
        });
      }

      updates.price = value;
    }

    if (compareAtPrice !== undefined) {
      if (compareAtPrice === null || compareAtPrice === "") {
        updates.compareAtPrice = null;
      } else {
        const value =
          typeof compareAtPrice === "number" ||
          typeof compareAtPrice === "string"
            ? String(compareAtPrice).trim()
            : "";

        if (
          !/^\d+(?:\.\d{1,2})?$/.test(value) ||
          !Number.isFinite(Number(value)) ||
          Number(value) < 0 ||
          Number(value) >= 10000000000
        ) {
          return res.status(400).json({
            success: false,
            message: "compareAtPrice must be non-negative with at most 2 decimal places.",
          });
        }

        updates.compareAtPrice = value;
      }
    }

    if (stockQuantity !== undefined) {
      if (
        !(
          typeof stockQuantity === "number" ||
          (typeof stockQuantity === "string" &&
            /^\d+$/.test(stockQuantity.trim()))
        ) ||
        !Number.isSafeInteger(Number(stockQuantity)) ||
        Number(stockQuantity) < 0 ||
        Number(stockQuantity) > 4294967295
      ) {
        return res.status(400).json({
          success: false,
          message: "stockQuantity must be a non-negative integer.",
        });
      }

      updates.stockQuantity = Number(stockQuantity);
    }

    if (isActive !== undefined) {
      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false.",
        });
      }

      updates.isActive = isActive;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid field to update.",
      });
    }

    await product.update(updates);

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: { product },
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "A product with this slug or SKU already exists.",
      });
    }

    console.error("Update product error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update product.",
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    const product = await Product.findByPk(Number(id));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    if (!product.isActive) {
      return res.status(409).json({
        success: false,
        message: "Product is already inactive.",
      });
    }

    await product.update({ isActive: false });

    return res.status(200).json({
      success: true,
      message: "Product deactivated successfully.",
    });
  } catch (error) {
    console.error("Delete product error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to deactivate product.",
    });
  }
};

const getInventory = async (req, res) => {
  try {
    const {
      page = "1",
      limit = "10",
      search,
      stockStatus = "all",
    } = req.query;

    if (
      !/^[1-9]\d*$/.test(page) ||
      !/^[1-9]\d*$/.test(limit) ||
      Number(page) > 1000000 ||
      Number(limit) > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Page must be positive and limit must be between 1 and 50.",
      });
    }

    if (
      search !== undefined &&
      (typeof search !== "string" ||
        !search.trim() ||
        search.trim().length > 100)
    ) {
      return res.status(400).json({
        success: false,
        message: "Search must contain 1 to 100 characters.",
      });
    }

    const allowedStockStatuses = ["all", "in_stock", "low_stock", "out_of_stock"];

    if (!allowedStockStatuses.includes(stockStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid stockStatus filter.",
        allowedStockStatuses,
      });
    }

    const where = {};

    if (search !== undefined) {
      const term = search.trim();

      where[Op.or] = [
        { name: { [Op.like]: `%${term}%` } },
        { sku: { [Op.like]: `%${term}%` } },
      ];
    }

    if (stockStatus === "out_of_stock") {
      where.stockQuantity = 0;
    } else if (stockStatus === "low_stock") {
      where.stockQuantity = { [Op.gt]: 0, [Op.lte]: 5 };
    } else if (stockStatus === "in_stock") {
      where.stockQuantity = { [Op.gt]: 5 };
    }

    const pageNumber = Number(page);
    const pageSize = Number(limit);

    const { count, rows } = await Product.findAndCountAll({
      where,
      attributes: [
        "id",
        "name",
        "sku",
        "stockQuantity",
        "isActive",
        "updatedAt",
      ],
      order: [["stockQuantity", "ASC"], ["id", "ASC"]],
      limit: pageSize,
      offset: (pageNumber - 1) * pageSize,
    });

    const [totalProducts, outOfStock, lowStock] = await Promise.all([
      Product.count(),
      Product.count({ where: { stockQuantity: 0 } }),
      Product.count({
        where: {
          stockQuantity: { [Op.gt]: 0, [Op.lte]: 5 },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Inventory retrieved successfully.",
      data: {
        inventory: rows,
        summary: {
          totalProducts,
          outOfStock,
          lowStock,
        },
        pagination: {
          totalProducts: count,
          currentPage: pageNumber,
          pageSize,
          totalPages: Math.ceil(count / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Get inventory error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve inventory.",
    });
  }
};

const adjustProductStock = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const { adjustment, reason } = req.body;

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    if (
      !Number.isSafeInteger(adjustment) ||
      adjustment === 0 ||
      !Number.isInteger(adjustment)
    ) {
      return res.status(400).json({
        success: false,
        message: "Adjustment must be a non-zero integer.",
      });
    }

    if (
      typeof reason !== "string" ||
      reason.trim().length < 3 ||
      reason.trim().length > 255
    ) {
      return res.status(400).json({
        success: false,
        message: "Reason must contain between 3 and 255 characters.",
      });
    }

    const result = await sequelize.transaction(async (transaction) => {
      const product = await Product.findByPk(productId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!product) {
        const error = new Error("Product not found.");
        error.statusCode = 404;
        throw error;
      }

      const previousStock = Number(product.stockQuantity);
      const newStock = previousStock + adjustment;

      if (!Number.isSafeInteger(newStock) || newStock < 0 || newStock > 4294967295) {
        const error = new Error(
          "Adjustment would result in an invalid stock quantity."
        );
        error.statusCode = 400;
        throw error;
      }

      await product.update(
        { stockQuantity: newStock },
        { transaction }
      );

      return {
        productId: product.id,
        productName: product.name,
        previousStock,
        adjustment,
        newStock,
        reason: reason.trim(),
      };
    });

    return res.status(200).json({
      success: true,
      message: "Product stock adjusted successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Adjust product stock error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode && error.statusCode < 500
          ? error.message
          : "Unable to adjust product stock.",
    });
  }
};


module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getInventory,
  adjustProductStock,
};