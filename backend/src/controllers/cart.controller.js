
"use strict";

const {
  Cart,
  CartItem,
  Product,
  ProductImage,
} = require("../models");

// Get the authenticated customer's cart.
// Create a cart automatically if one does not exist.
const getOrCreateCart = async (userId) => {
  const [cart] = await Cart.findOrCreate({
    where: { userId },
    defaults: { userId },
  });

  return cart;
};

// GET: Retrieve the authenticated customer's cart
const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);

    const items = await CartItem.findAll({
      where: { cartId: cart.id },
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

    const cartItems = items.map((item) => {
      const product = item.product;
      const price = Number(product.price);
      const quantity = Number(item.quantity);

      return {
        id: item.id,
        productId: item.productId,
        quantity,
        product: product,
        subtotal: Number((price * quantity).toFixed(2)),
      };
    });

    const totalItems = cartItems.reduce(
      (total, item) => total + item.quantity,
      0
    );

    const totalPrice = Number(
      cartItems
        .reduce((total, item) => total + item.subtotal, 0)
        .toFixed(2)
    );

    return res.status(200).json({
      success: true,
      message: "Cart retrieved successfully.",
      data: {
        cartId: cart.id,
        items: cartItems,
        totalItems,
        totalPrice,
      },
    });
  } catch (error) {
    console.error("Get cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve the cart.",
    });
  }
};

// POST: Add a product to the authenticated customer's cart
const addToCart = async (req, res) => {
  try {
    const productId = Number(req.body.productId);
    const quantity = Number(req.body.quantity ?? 1);

    if (
      !Number.isSafeInteger(productId) ||
      productId < 1 ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid productId and positive integer quantity are required.",
      });
    }

    const product = await Product.findByPk(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Check availability when the Product model has an active flag.
    if (
      Object.prototype.hasOwnProperty.call(product.dataValues, "isActive") &&
      !product.isActive
    ) {
      return res.status(400).json({
        success: false,
        message: "This product is not available.",
      });
    }

    const cart = await getOrCreateCart(req.user.id);

    const existingItem = await CartItem.findOne({
      where: {
        cartId: cart.id,
        productId,
      },
    });

    let cartItem;

    if (existingItem) {
      existingItem.quantity =
        Number(existingItem.quantity) + quantity;

      await existingItem.save();
      cartItem = existingItem;
    } else {
      cartItem = await CartItem.create({
        cartId: cart.id,
        productId,
        quantity,
      });
    }

    return res.status(201).json({
      success: true,
      message: existingItem
        ? "Cart item quantity increased successfully."
        : "Product added to cart successfully.",
      data: {
        cartItem: {
          id: cartItem.id,
          cartId: cartItem.cartId,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
        },
      },
    });
  } catch (error) {
    console.error("Add to cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add the product to the cart.",
    });
  }
};

// PATCH: Update the quantity of a cart item
const updateCartItem = async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);
    const quantity = Number(req.body.quantity);

    if (
      !Number.isSafeInteger(itemId) ||
      itemId < 1 ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid itemId and positive integer quantity are required.",
      });
    }

    const cart = await getOrCreateCart(req.user.id);

    const cartItem = await CartItem.findOne({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found.",
      });
    }

    cartItem.quantity = quantity;
    await cartItem.save();

    return res.status(200).json({
      success: true,
      message: "Cart item quantity updated successfully.",
      data: {
        cartItem: {
          id: cartItem.id,
          productId: cartItem.productId,
          quantity: cartItem.quantity,
        },
      },
    });
  } catch (error) {
    console.error("Update cart item error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update the cart item.",
    });
  }
};

// DELETE: Remove a product from the authenticated customer's cart
const removeCartItem = async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);

    if (!Number.isSafeInteger(itemId) || itemId < 1) {
      return res.status(400).json({
        success: false,
        message: "A valid cart item ID is required.",
      });
    }

    const cart = await getOrCreateCart(req.user.id);

    const cartItem = await CartItem.findOne({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found.",
      });
    }

    await cartItem.destroy();

    return res.status(200).json({
      success: true,
      message: "Product removed from cart successfully.",
    });
  } catch (error) {
    console.error("Remove cart item error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove the cart item.",
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user.id);

    await CartItem.destroy({
      where: {
        cartId: cart.id,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully.",
    });
  } catch (error) {
    console.error("Clear cart error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to clear the cart.",
    });
  }
};


module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
