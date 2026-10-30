
"use strict";

const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const {
  authorizeRoles,
} = require("../middleware/authorize.middleware");
const {
  getAdminDashboard,
} = require("../controllers/admin.controller");
const {
  getAllOrders,
  updateOrderStatus,
  createOrderRefund,
  getAllRefunds,
} = require("../controllers/order.controller");
const router = express.Router();

router.get(
  "/dashboard",
  authenticate,
  authorizeRoles("admin"),
  getAdminDashboard
);
router.get(
  "/orders",
  authenticate,
  authorizeRoles("admin"),
  getAllOrders
);

router.patch(
  "/orders/:orderId/status",
  authenticate,
  authorizeRoles("admin"),
  updateOrderStatus
);
router.post(
  "/orders/:orderId/refunds",
  authenticate,
  authorizeRoles("admin"),
  createOrderRefund
);
router.get(
  "/refunds",
  authenticate,
  authorizeRoles("admin"),
  getAllRefunds
);

module.exports = router;
