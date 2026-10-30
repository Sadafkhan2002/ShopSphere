
"use strict";

const crypto = require("crypto");
const sequelize = require("../config/database");

const {
  User,
  Cart,
  CartItem,
  Product,
  Order,
  OrderItem,
  Refund,
} = require("../models");

// Convert monetary values to integer minor units to reduce rounding errors.
const toMinorUnits = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Invalid monetary value.");
  }

  return Math.round(amount * 100);
};

const fromMinorUnits = (value) => (value / 100).toFixed(2);

// CUSTOMER: Create an order from the customer's cart
const createOrder = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const {
      shippingFullName,
      shippingPhone,
      shippingAddressLine1,
      shippingAddressLine2,
      shippingCity,
      shippingState,
      shippingPostalCode,
      shippingCountry,
      notes,
    } = req.body;

    const requiredFields = {
      shippingFullName,
      shippingPhone,
      shippingAddressLine1,
      shippingCity,
      shippingCountry,
    };

    for (const [field, value] of Object.entries(requiredFields)) {
      if (typeof value !== "string" || !value.trim()) {
        return res.status(400).json({
          success: false,
          message: `${field} is required.`,
        });
      }
    }

    const order = await sequelize.transaction(async (transaction) => {
      const cart = await Cart.findOne({
        where: { userId },
        include: [
          {
            model: CartItem,
            as: "items",
            required: false,
          },
        ],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!cart || !cart.items || cart.items.length === 0) {
        const error = new Error("Your shopping cart is empty.");
        error.statusCode = 400;
        throw error;
      }

      let subtotalMinor = 0;
      const orderItems = [];

      for (const cartItem of cart.items) {
        const quantity = Number(cartItem.quantity);

        if (!Number.isInteger(quantity) || quantity < 1) {
          const error = new Error(
            "The cart contains an invalid product quantity."
          );
          error.statusCode = 400;
          throw error;
        }

        const product = await Product.findByPk(cartItem.productId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!product || !product.isActive) {
          const error = new Error(
            `Product ID ${cartItem.productId} is unavailable.`
          );
          error.statusCode = 400;
          throw error;
        }

        if (Number(product.stockQuantity) < quantity) {
          const error = new Error(
            `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}.`
          );
          error.statusCode = 400;
          throw error;
        }

        const unitPriceMinor = toMinorUnits(product.price);
        const lineTotalMinor = unitPriceMinor * quantity;

        subtotalMinor += lineTotalMinor;

        if (!Number.isSafeInteger(subtotalMinor)) {
          throw new Error("Order total exceeds the supported limit.");
        }

        orderItems.push({
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          quantity,
          unitPrice: fromMinorUnits(unitPriceMinor),
          lineTotal: fromMinorUnits(lineTotalMinor),
        });

        // Decrease inventory inside the same transaction.
        await product.update(
          {
            stockQuantity: Number(product.stockQuantity) - quantity,
          },
          { transaction }
        );
      }

      // Shipping, discount, and tax are not integrated yet.
      const shippingFeeMinor = 0;
      const discountMinor = 0;
      const taxMinor = 0;

      const totalMinor =
        subtotalMinor + shippingFeeMinor - discountMinor + taxMinor;

      if (totalMinor < 0) {
        const error = new Error("Invalid order total.");
        error.statusCode = 400;
        throw error;
      }

      const orderNumber =
        `SS-${Date.now()}-` +
        crypto.randomBytes(4).toString("hex").toUpperCase();

      const newOrder = await Order.create(
        {
          orderNumber,
          userId,
          status: "pending",
          subtotal: fromMinorUnits(subtotalMinor),
          shippingFee: fromMinorUnits(shippingFeeMinor),
          discountAmount: fromMinorUnits(discountMinor),
          taxAmount: fromMinorUnits(taxMinor),
          totalAmount: fromMinorUnits(totalMinor),
          currency: "PKR",
          paymentStatus: "pending",
          shippingFullName: shippingFullName.trim(),
          shippingPhone: shippingPhone.trim(),
          shippingAddressLine1: shippingAddressLine1.trim(),
          shippingAddressLine2:
            typeof shippingAddressLine2 === "string"
              ? shippingAddressLine2.trim() || null
              : null,
          shippingCity: shippingCity.trim(),
          shippingState:
            typeof shippingState === "string"
              ? shippingState.trim() || null
              : null,
          shippingPostalCode:
            typeof shippingPostalCode === "string"
              ? shippingPostalCode.trim() || null
              : null,
          shippingCountry: shippingCountry.trim(),
          notes:
            typeof notes === "string" ? notes.trim() || null : null,
          placedAt: new Date(),
        },
        { transaction }
      );

      await OrderItem.bulkCreate(
        orderItems.map((item) => ({
          ...item,
          orderId: newOrder.id,
        })),
        { transaction }
      );

      // Clear purchased cart items only after order items are saved.
      await CartItem.destroy({
        where: { cartId: cart.id },
        transaction,
      });

      return Order.findByPk(newOrder.id, {
        include: [
          {
            model: OrderItem,
            as: "items",
          },
        ],
        transaction,
      });
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      data: { order },
    });
  } catch (error) {
    console.error("Create order error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode && error.statusCode < 500
          ? error.message
          : "Unable to create the order. Please try again.",
    });
  }
};

// CUSTOMER: Retrieve the authenticated customer's order history
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const orders = await Order.findAll({
      where: { userId },
      include: [
        {
          model: OrderItem,
          as: "items",
          attributes: [
            "id",
            "productId",
            "productName",
            "productSku",
            "quantity",
            "unitPrice",
            "lineTotal",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Your orders retrieved successfully.",
      data: {
        totalOrders: orders.length,
        orders,
      },
    });
  } catch (error) {
    console.error("Get customer orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your orders.",
    });
  }
};


 // CUSTOMER: Retrieve one order belonging to the authenticated customer
const getMyOrderById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const orderId = Number(req.params.orderId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    if (!Number.isInteger(orderId) || orderId < 1) {
      return res.status(400).json({
        success: false,
        message: "A valid order ID is required.",
      });
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        userId,
      },
      include: [
        {
          model: OrderItem,
          as: "items",
          attributes: [
            "id",
            "productId",
            "productName",
            "productSku",
            "quantity",
            "unitPrice",
            "lineTotal",
          ],
        },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order details retrieved successfully.",
      data: { order },
    });
  } catch (error) {
    console.error("Get customer order details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve order details.",
    });
  }
};

 // CUSTOMER: Cancel an order that is still pending
const cancelMyOrder = async (req, res) => {
  try {
    const userId = req.user?.id;
    const orderId = Number(req.params.orderId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    if (!Number.isInteger(orderId) || orderId < 1) {
      return res.status(400).json({
        success: false,
        message: "A valid order ID is required.",
      });
    }

    const result = await sequelize.transaction(async (transaction) => {
      const order = await Order.findOne({
        where: {
          id: orderId,
          userId,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!order) {
        const error = new Error("Order not found.");
        error.statusCode = 404;
        throw error;
      }

      if (order.status !== "pending") {
        const error = new Error(
          "Only pending orders can be cancelled."
        );
        error.statusCode = 400;
        throw error;
      }

      // Do not cancel an order that has already been paid.
      if (order.paymentStatus === "paid") {
        const error = new Error(
          "This order has been paid. Use the refund process before cancellation."
        );
        error.statusCode = 400;
        throw error;
      }

      const items = await OrderItem.findAll({
        where: { orderId: order.id },
        transaction,
      });

      // Restore the stock reserved when the order was created.
      for (const item of items) {
        const product = await Product.findByPk(item.productId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (product) {
          await product.increment(
            "stockQuantity",
            {
              by: Number(item.quantity),
              transaction,
            }
          );
        }
      }

      await order.update(
        { status: "cancelled" },
        { transaction }
      );

      return order;
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      data: { order: result },
    });
  } catch (error) {
    console.error("Cancel customer order error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode && error.statusCode < 500
          ? error.message
          : "Unable to cancel the order. Please try again.",
    });
  }
};

 // CUSTOMER: Simulate payment for an existing order
const simulatePayment = async (req, res) => {
  try {
    const userId = req.user?.id;
    const orderId = Number(req.params.orderId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    if (!Number.isInteger(orderId) || orderId < 1) {
      return res.status(400).json({
        success: false,
        message: "A valid order ID is required.",
      });
    }

    const order = await sequelize.transaction(async (transaction) => {
      const existingOrder = await Order.findOne({
        where: {
          id: orderId,
          userId,
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!existingOrder) {
        const error = new Error("Order not found.");
        error.statusCode = 404;
        throw error;
      }

      if (existingOrder.status === "cancelled") {
        const error = new Error("Cancelled orders cannot be paid.");
        error.statusCode = 400;
        throw error;
      }

      if (existingOrder.paymentStatus === "paid") {
        const error = new Error("This order has already been paid.");
        error.statusCode = 400;
        throw error;
      }

      if (
        ["refunded", "partially_refunded"].includes(
          existingOrder.paymentStatus
        )
      ) {
        const error = new Error(
          "This order's payment has already been refunded or partially refunded."
        );
        error.statusCode = 400;
        throw error;
      }

      // This is a DEMO simulation, not a real financial transaction.
      // The server determines the outcome; the client cannot force success.
      const paymentSucceeded = true;

      if (!paymentSucceeded) {
        await existingOrder.update(
          { paymentStatus: "failed" },
          { transaction }
        );

        return existingOrder;
      }

      const updates = {
  paymentStatus: "paid",
};

// Confirm the order after successful simulated payment
if (existingOrder.status === "pending") {
  updates.status = "confirmed";
}

await existingOrder.update(updates, { transaction });

      return existingOrder;
    });

    if (order.paymentStatus === "failed") {
      return res.status(402).json({
        success: false,
        message: "Simulated payment failed.",
        data: { order },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Simulated payment completed successfully. No real money was charged.",
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        currency: order.currency,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    console.error("Simulated payment error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode && error.statusCode < 500
          ? error.message
          : "Unable to process the simulated payment.",
    });
  }
};


 // ADMIN: Retrieve all customer orders
const getAllOrders = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, Number.parseInt(req.query.pageSize, 10) || 10)
    );

    const offset = (page - 1) * pageSize;

    const { count, rows } = await Order.findAndCountAll({
      include: [
        {
          model: OrderItem,
          as: "items",
          attributes: [
            "id",
            "productId",
            "productName",
            "productSku",
            "quantity",
            "unitPrice",
            "lineTotal",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit: pageSize,
      offset,
      distinct: true,
    });

    return res.status(200).json({
      success: true,
      message: "Orders retrieved successfully.",
      data: {
        orders: rows,
        pagination: {
          totalOrders: count,
          currentPage: page,
          pageSize,
          totalPages: Math.ceil(count / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("Get all orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve orders.",
    });
  }
};

 
 // ADMIN: Update an order's status safely
const updateOrderStatus = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const { status } = req.body;

    const allowedStatuses = [
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
        allowedStatuses,
      });
    }

    const updatedOrder = await sequelize.transaction(
      async (transaction) => {
        // Lock the order so concurrent cancellation requests
        // cannot both restore its inventory.
        const order = await Order.findByPk(orderId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!order) {
          const error = new Error("Order not found.");
          error.statusCode = 404;
          throw error;
        }

        if (
          ["cancelled", "delivered", "refunded"].includes(order.status)
        ) {
          const error = new Error(
            `Cannot update an order with status '${order.status}'.`
          );
          error.statusCode = 400;
          throw error;
        }

        if (status === "cancelled") {
          if (order.paymentStatus === "paid") {
            const error = new Error(
              "Paid orders require the refund workflow before cancellation."
            );
            error.statusCode = 400;
            throw error;
          }

          if (
            ["refunded", "partially_refunded"].includes(
              order.paymentStatus
            )
          ) {
            const error = new Error(
              "Refunded orders cannot be cancelled through this workflow."
            );
            error.statusCode = 400;
            throw error;
          }

          const items = await OrderItem.findAll({
            where: { orderId: order.id },
            transaction,
          });

          // Restore inventory within the same transaction as cancellation.
          for (const item of items) {
            const product = await Product.findByPk(item.productId, {
              transaction,
              lock: transaction.LOCK.UPDATE,
            });

            // A deleted product cannot be restored, but cancellation
            // should not fail merely because its product no longer exists.
            if (product) {
              await product.increment("stockQuantity", {
                by: Number(item.quantity),
                transaction,
              });
            }
          }
        }

        await order.update({ status }, { transaction });

        return Order.findByPk(order.id, {
          transaction,
          include: [
            {
              model: OrderItem,
              as: "items",
            },
          ],
        });
      }
    );

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully.",
      data: { order: updatedOrder },
    });
  } catch (error) {
    console.error("Update order status error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode && error.statusCode < 500
          ? error.message
          : "Unable to update order status.",
    });
  }
};

 // ADMIN: Record a simulated full or partial refund
const createOrderRefund = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const adminId = req.user?.id;
    const { amount, reason } = req.body;

    if (!Number.isInteger(orderId) || orderId < 1) {
      return res.status(400).json({
        success: false,
        message: "A valid order ID is required.",
      });
    }

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    // Accept a positive monetary amount with no more than two decimals.
    const amountText = String(amount ?? "").trim();

    if (!/^\d+(\.\d{1,2})?$/.test(amountText)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid refund amount with up to two decimal places.",
      });
    }

    const refundMinor = Math.round(Number(amountText) * 100);

    if (!Number.isSafeInteger(refundMinor) || refundMinor <= 0) {
      return res.status(400).json({
        success: false,
        message: "Refund amount must be greater than zero.",
      });
    }

    if (
      typeof reason !== "string" ||
      !reason.trim() ||
      reason.trim().length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "A refund reason of 1–500 characters is required.",
      });
    }

    const result = await sequelize.transaction(async (transaction) => {
      const order = await Order.findByPk(orderId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!order) {
        const error = new Error("Order not found.");
        error.statusCode = 404;
        throw error;
      }

      if (!["paid", "partially_refunded"].includes(order.paymentStatus)) {
        const error = new Error(
          "Only paid or partially refunded orders can receive a refund."
        );
        error.statusCode = 400;
        throw error;
      }

      const orderTotalMinor = toMinorUnits(order.totalAmount);

      const previousRefunds = await Refund.findAll({
        where: { orderId: order.id, status: "processed" },
        attributes: ["amount"],
        transaction,
      });

      const alreadyRefundedMinor = previousRefunds.reduce(
        (total, refund) => total + toMinorUnits(refund.amount),
        0
      );

      if (alreadyRefundedMinor + refundMinor > orderTotalMinor) {
        const error = new Error(
          `Refund exceeds the remaining refundable amount of ${fromMinorUnits(
            orderTotalMinor - alreadyRefundedMinor
          )} ${order.currency}.`
        );
        error.statusCode = 400;
        throw error;
      }

      const refund = await Refund.create(
        {
          orderId: order.id,
          userId: order.userId,
          processedBy: adminId,
          amount: fromMinorUnits(refundMinor),
          currency: order.currency || "PKR",
          reason: reason.trim(),
          status: "processed",
          isSimulated: true,
        },
        { transaction }
      );

      const totalRefundedMinor = alreadyRefundedMinor + refundMinor;
      const fullyRefunded = totalRefundedMinor >= orderTotalMinor;

      await order.update(
        {
          paymentStatus: fullyRefunded
            ? "refunded"
            : "partially_refunded",
          ...(fullyRefunded ? { status: "refunded" } : {}),
        },
        { transaction }
      );

      return {
        refund,
        orderId: order.id,
        orderNumber: order.orderNumber,
        paymentStatus: fullyRefunded
          ? "refunded"
          : "partially_refunded",
        orderTotal: fromMinorUnits(orderTotalMinor),
        totalRefunded: fromMinorUnits(totalRefundedMinor),
        remainingRefundable: fromMinorUnits(
          orderTotalMinor - totalRefundedMinor
        ),
      };
    });

    return res.status(201).json({
      success: true,
      message: "Simulated refund recorded successfully. No real money was transferred.",
      data: result,
    });
  } catch (error) {
    console.error("Create order refund error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode && error.statusCode < 500
          ? error.message
          : "Unable to record the refund. Please try again.",
    });
  }
};


const getMyPaymentHistory = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const orders = await Order.findAll({
      where: { userId },
      attributes: [
        "id",
        "orderNumber",
        "totalAmount",
        "currency",
        "paymentStatus",
        "status",
        "createdAt",
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Payment history retrieved successfully.",
      data: {
        payments: orders.map((order) => ({
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: order.totalAmount,
          currency: order.currency,
          paymentStatus: order.paymentStatus,
          orderStatus: order.status,
          orderDate: order.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Payment history error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve payment history.",
    });
  }
};

const getMyRefunds = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    const refunds = await Refund.findAll({
      where: { userId },
      include: [
        {
          model: Order,
          as: "order",
          attributes: [
            "id",
            "orderNumber",
            "totalAmount",
            "currency",
            "status",
            "paymentStatus",
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Your refund history retrieved successfully.",
      data: {
        totalRefunds: refunds.length,
        refunds,
      },
    });
  } catch (error) {
    console.error("Get customer refunds error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve refund history.",
    });
  }
};

const getAllRefunds = async (req, res) => {
  try {
    const refunds = await Refund.findAll({
      include: [
        {
          model: Order,
          as: "order",
          attributes: [
            "id",
            "orderNumber",
            "totalAmount",
            "currency",
            "status",
            "paymentStatus",
          ],
        },
        {
          model: User,
          as: "customer",
          attributes: ["id", "firstName", "lastName", "email"],
        },
        {
          model: User,
          as: "processor",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      message: "Refund records retrieved successfully.",
      data: {
        totalRefunds: refunds.length,
        refunds,
      },
    });
  } catch (error) {
    console.error("Get all refunds error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve refund records.",
    });
  }
};


module.exports = {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  simulatePayment,
  getAllOrders,
  updateOrderStatus,
  getMyPaymentHistory,
  createOrderRefund,
  getMyRefunds,
  getAllRefunds,
};
