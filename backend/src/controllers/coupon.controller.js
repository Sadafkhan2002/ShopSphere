
"use strict";

const { Coupon, CouponUsage } = require("../models");
const { Op } = require("sequelize");

const validateCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    // 1. Validate request data
    if (typeof code !== "string" || !code.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid coupon code.",
      });
    }

    const orderSubtotal = Number(subtotal);

    if (
      subtotal === undefined ||
      subtotal === null ||
      subtotal === "" ||
      !Number.isFinite(orderSubtotal) ||
      orderSubtotal < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Subtotal must be a valid non-negative number.",
      });
    }

    // 2. Require an authenticated customer
    const userId = req.user?.id ?? req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Please log in to validate a coupon.",
      });
    }

    // 3. Find coupon (Coupon model normalizes codes to uppercase)
    const coupon = await Coupon.findOne({
      where: {
        code: code.trim().toUpperCase(),
      },
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon code does not exist.",
      });
    }

    // 4. Check whether the coupon is active
    if (!coupon.isActive) {
      return res.status(400).json({
        success: false,
        message: "This coupon is inactive.",
      });
    }

    // 5. Check start and expiry dates
    const now = new Date();

    if (now < new Date(coupon.startsAt)) {
      return res.status(400).json({
        success: false,
        message: "This coupon is not available yet.",
      });
    }

    if (now > new Date(coupon.expiresAt)) {
      return res.status(400).json({
        success: false,
        message: "This coupon has expired.",
      });
    }

    // 6. Check overall usage limit
    if (
      coupon.usageLimit !== null &&
      Number(coupon.usedCount) >= Number(coupon.usageLimit)
    ) {
      return res.status(400).json({
        success: false,
        message: "This coupon has reached its usage limit.",
      });
    }

    // 7. Check minimum order amount
    if (orderSubtotal < Number(coupon.minimumOrderAmount)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ${Number(
          coupon.minimumOrderAmount
        ).toFixed(2)}.`,
      });
    }

    // 8. Check how many times this customer has used the coupon
    const userUsageCount = await CouponUsage.count({
      where: {
        couponId: coupon.id,
        userId,
      },
    });

    if (userUsageCount >= Number(coupon.perUserLimit)) {
      return res.status(400).json({
        success: false,
        message: "You have already used this coupon the maximum number of times.",
      });
    }

    // 9. Calculate discount
    const discountValue = Number(coupon.discountValue);
    let discountAmount;

    if (coupon.discountType === "percentage") {
      if (discountValue > 100) {
        return res.status(500).json({
          success: false,
          message: "Coupon configuration error: percentage discount exceeds 100%.",
        });
      }

      discountAmount = (orderSubtotal * discountValue) / 100;

      if (coupon.maximumDiscountAmount !== null) {
        discountAmount = Math.min(
          discountAmount,
          Number(coupon.maximumDiscountAmount)
        );
      }
    } else if (coupon.discountType === "fixed") {
      discountAmount = discountValue;
    } else {
      return res.status(500).json({
        success: false,
        message: "Unsupported coupon discount type.",
      });
    }

    // 10. Never discount more than the subtotal.
    // Round monetary results to two decimal places.
    discountAmount = Math.min(
      orderSubtotal,
      Math.max(0, Math.round((discountAmount + Number.EPSILON) * 100) / 100)
    );

    const finalTotal = Math.max(
      0,
      Math.round(
        (orderSubtotal - discountAmount + Number.EPSILON) * 100
      ) / 100
    );

    // 11. Return the preview without recording coupon usage
    return res.status(200).json({
      success: true,
      message: "Coupon validated successfully.",
      data: {
        coupon: {
          id: coupon.id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: Number(coupon.discountValue),
        },
        subtotal: Number(orderSubtotal.toFixed(2)),
        discountAmount,
        finalTotal,
      },
    });
  } catch (error) {
    console.error("Validate coupon error:", error);

    return res.status(500).json({
      success: false,
      message: "An error occurred while validating the coupon.",
    });
  }
};

module.exports = {
  validateCoupon,
};
