
"use strict";

const express = require("express");

const { authenticate } = require("../middleware/auth.middleware");
const {
  authorizeRoles,
} = require("../middleware/authorize.middleware");

const {
  getCustomerProfile,
} = require("../controllers/customer.controller");

const {
  validateCoupon,
} = require("../controllers/coupon.controller");

const {
  createOrder,
  getMyOrders,
  getMyOrderById,
  cancelMyOrder,
  simulatePayment,
  getMyPaymentHistory,
  getMyRefunds,
} = require("../controllers/order.controller");

const {
  createSafepayTracker,
  createSafepayCheckoutUrl,
} = require("../controllers/safepay.controller");

const router = express.Router();

// GET: Customer profile
router.get(
  "/profile",
  authenticate,
  authorizeRoles("customer"),
  getCustomerProfile
);

// POST: Validate coupon and calculate discount
router.post(
  "/coupons/validate",
  authenticate,
  authorizeRoles("customer"),
  validateCoupon
);

// POST: Create an order from the customer's cart
router.post(
  "/orders",
  authenticate,
  authorizeRoles("customer"),
  createOrder
);

router.get(
  "/orders",
  authenticate,
  authorizeRoles("customer"),
  getMyOrders
);

router.get(
  "/orders/:orderId",
  authenticate,
  authorizeRoles("customer"),
  getMyOrderById
);

router.patch(
  "/orders/:orderId/cancel",
  authenticate,
  authorizeRoles("customer"),
  cancelMyOrder
);
// POST: Simulate payment for a customer's order
router.post(
  "/orders/:orderId/pay",
  authenticate,
  authorizeRoles("customer"),
  simulatePayment
);
// POST: Initialize Safepay sandbox payment for an order
router.post(
  "/orders/:orderId/safepay",
  authenticate,
  authorizeRoles("customer"),
  createSafepayTracker
);
router.post(
  "/orders/:orderId/safepay/checkout",
  authenticate,
  authorizeRoles("customer"),
  createSafepayCheckoutUrl
);
router.get(
  "/payments",
  authenticate,
  authorizeRoles("customer"),
  getMyPaymentHistory
);
router.get(
  "/refunds",
  authenticate,
  authorizeRoles("customer"),
  getMyRefunds
);
module.exports = router;
