
"use strict";

const { UniqueConstraintError, ValidationError } = require("sequelize");
const Category = require("../models/Category");

const createCategory = async (req, res) => {
  try {
    const { name, slug, description } = req.body;

    if (typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Category name must contain at least 2 characters.",
      });
    }

    if (typeof slug !== "string" || slug.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: "Category slug must contain at least 2 characters.",
      });
    }

    const category = await Category.create({
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description:
        typeof description === "string" && description.trim()
          ? description.trim()
          : null,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: { category },
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        success: false,
        message: "A category with this name or slug already exists.",
      });
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Category validation failed.",
        errors: error.errors.map((item) => item.message),
      });
    }

    console.error("Create category error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create category.",
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      attributes: [
        "id",
        "name",
        "slug",
        "description",
        "isActive",
        "createdAt",
      ],
      order: [["name", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: { categories },
    });
  } catch (error) {
    console.error("Get categories error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve categories.",
    });
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id) || Number(id) < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    const category = await Category.findOne({
      where: { id: Number(id), isActive: true },
      attributes: [
        "id",
        "name",
        "slug",
        "description",
        "isActive",
        "createdAt",
      ],
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: { category },
    });
  } catch (error) {
    console.error("Get category error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve category.",
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id) || Number(id) < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    const category = await Category.findByPk(Number(id));

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const { name, slug, description, isActive } = req.body;
    const updates = {};

    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: "Category name must be between 2 and 100 characters.",
        });
      }
      updates.name = name.trim();
    }

    if (slug !== undefined) {
      if (typeof slug !== "string" || slug.trim().length < 2 || slug.trim().length > 120) {
        return res.status(400).json({
          success: false,
          message: "Category slug must be between 2 and 120 characters.",
        });
      }
      updates.slug = slug.trim().toLowerCase();
    }

    if (description !== undefined) {
      if (description !== null && typeof description !== "string") {
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

    await category.update(updates);

    return res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      data: { category },
    });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        success: false,
        message: "A category with this name or slug already exists.",
      });
    }

    console.error("Update category error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update category.",
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id) || Number(id) < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });
    }

    const category = await Category.findByPk(Number(id));

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    await category.destroy();

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Delete category error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to delete category.",
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};


