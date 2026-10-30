
"use strict";

const { Order } = require("../models");

const createSafepayTracker = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const userId = req.user.id;

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    if (
      !process.env.SAFEPAY_PUBLIC_KEY ||
      !process.env.SAFEPAY_SECRET_KEY
    ) {
      return res.status(500).json({
        success: false,
        message: "Safepay keys are not configured.",
      });
    }

    if (process.env.SAFEPAY_ENV !== "sandbox") {
      return res.status(500).json({
        success: false,
        message: "Safepay sandbox mode must be enabled.",
      });
    }

    const order = await Order.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      order.status === "cancelled" ||
      order.paymentStatus !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message: "This order is not eligible for payment.",
      });
    }

    if (order.safepayTrackerId) {
      return res.status(409).json({
        success: false,
        message: "A Safepay tracker already exists for this order.",
        data: {
          trackerId: order.safepayTrackerId,
        },
      });
    }

    const amount = Math.round(Number(order.totalAmount) * 100);

    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Order amount is invalid.",
      });
    }

    const response = await fetch(
      "https://sandbox.api.getsafepay.com/order/payments/v3/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SFPY-MERCHANT-SECRET":
            process.env.SAFEPAY_SECRET_KEY,
        },
        body: JSON.stringify({
          merchant_api_key: process.env.SAFEPAY_PUBLIC_KEY,
          intent: "CYBERSOURCE",
          mode: "payment",
          entry_mode: "raw",
          currency: order.currency,
          amount,
          metadata: {
            source: "shopsphere",
            order_id: String(order.id),
          },
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Safepay tracker request failed:", {
        status: response.status,
        result,
      });

      return res.status(502).json({
        success: false,
        message: "Safepay could not create the payment tracker.",
        providerStatus: response.status,
      });
    }

    const tracker =
      result?.data?.tracker ??
      result?.tracker ??
      result?.data;

    const trackerId =
      tracker?.token ??
      tracker?.tracker_id ??
      tracker?.id;

    if (typeof trackerId !== "string" || !trackerId) {
      console.error("Safepay tracker response format was unexpected.");

      return res.status(502).json({
        success: false,
        message: "Safepay did not return a recognized tracker ID.",
      });
    }

    await order.update({ safepayTrackerId: trackerId });

    return res.status(201).json({
      success: true,
      message: "Safepay sandbox tracker created.",
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        amount,
        currency: order.currency,
        trackerId,
        paymentStatus: order.paymentStatus,
        nextStep: "Generate the checkout URL for this tracker.",
      },
    });
  } catch (error) {
    console.error("Safepay tracker error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to initialize Safepay payment.",
    });
  }
};

const createSafepayCheckoutUrl = async (req, res) => {
  try {
    const orderId = Number(req.params.orderId);
    const userId = req.user.id;

    if (!Number.isSafeInteger(orderId) || orderId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findOne({
      where: { id: orderId, userId },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      order.status === "cancelled" ||
      order.paymentStatus !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message: "This order is not eligible for payment.",
      });
    }

    if (!order.safepayTrackerId) {
      return res.status(400).json({
        success: false,
        message: "Create a Safepay tracker first.",
      });
    }

    if (
      !process.env.SAFEPAY_PUBLIC_KEY ||
      !process.env.SAFEPAY_SECRET_KEY ||
      process.env.SAFEPAY_ENV !== "sandbox"
    ) {
      return res.status(500).json({
        success: false,
        message: "Safepay sandbox configuration is incomplete.",
      });
    }

    // Obtain the Safepay authentication token.
    const tokenResponse = await fetch(
      "https://sandbox.api.getsafepay.com/client/passport/v1/token",
      {
        method: "POST",
        headers: {
          "X-SFPY-MERCHANT-SECRET":
            process.env.SAFEPAY_SECRET_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(15000),
      }
    );

    const tokenResult = await tokenResponse.json();

    if (
      !tokenResponse.ok ||
      typeof tokenResult?.data !== "string" ||
      !tokenResult.data
    ) {
      console.error("Safepay authentication failed:", {
        status: tokenResponse.status,
        providerMessage:
          tokenResult?.status?.message ?? "No provider message",
      });

      return res.status(502).json({
        success: false,
        message: "Safepay could not issue a checkout authentication token.",
        providerStatus: tokenResponse.status,
      });
    }

    const frontendUrl = (
      process.env.FRONTEND_URL || "http://localhost:5173"
    ).replace(/\/+$/, "");

    const safepay = require("@sfpy/node-core")(
      process.env.SAFEPAY_SECRET_KEY,
      {
        authType: "secret",
        host: "https://sandbox.api.getsafepay.com",
      }
    );

    if (
      !safepay.checkout ||
      typeof safepay.checkout.createCheckoutUrl !== "function"
    ) {
      console.error("Safepay SDK checkout method is unavailable.");

      return res.status(500).json({
        success: false,
        message: "The installed Safepay SDK checkout method is unavailable.",
      });
    }

    // Generate the checkout URL using the installed SDK.
    
const checkoutResult = safepay.checkout.createCheckoutUrl({
  tracker: order.safepayTrackerId,
  tbt: tokenResult.data,
  env: "sandbox",
  source: "hosted",
  order_id: String(order.id),
  redirect_url: `${frontendUrl}/payment/success`,
  cancel_url: `${frontendUrl}/payment/cancel`,
});


    // Extract the URL exactly once.
    let checkoutUrl = null;

    if (typeof checkoutResult === "string") {
      checkoutUrl = checkoutResult.trim();
    } else if (checkoutResult instanceof URL) {
      checkoutUrl = checkoutResult.href;
    } else if (
      checkoutResult &&
      typeof checkoutResult === "object"
    ) {
      const candidate =
        checkoutResult.url ??
        checkoutResult.href ??
        checkoutResult.redirect ??
        checkoutResult.checkoutUrl;

      if (typeof candidate === "string") {
        checkoutUrl = candidate.trim();
      }
    }

    let validCheckoutUrl = false;

    if (checkoutUrl) {
      try {
        const parsedUrl = new URL(checkoutUrl);

        validCheckoutUrl =
          parsedUrl.protocol === "https:" &&
          Boolean(parsedUrl.hostname);
      } catch {
        validCheckoutUrl = false;
      }
    }

    if (!validCheckoutUrl) {
      // Safe diagnostic: never print the checkout URL or token.
      console.error("Safepay checkout result diagnostic:", {
        resultType: typeof checkoutResult,
        resultLength:
          typeof checkoutResult === "string"
            ? checkoutResult.length
            : null,
        isEmpty:
          typeof checkoutResult === "string"
            ? checkoutResult.trim().length === 0
            : null,
        startsWithHttps:
          typeof checkoutResult === "string"
            ? checkoutResult.trim().startsWith("https://")
            : null,
        resultKeys:
          checkoutResult &&
          typeof checkoutResult === "object"
            ? Object.keys(checkoutResult)
            : [],
      });

      return res.status(502).json({
        success: false,
        message:
          "Safepay did not return a valid HTTPS checkout URL. Check the backend terminal diagnostic.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Safepay checkout URL generated.",
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        checkoutUrl,
        paymentStatus: order.paymentStatus,
      },
    });
  } catch (error) {
    console.error("Safepay checkout URL error:", error.message);

    return res.status(502).json({
      success: false,
      message: "Unable to generate the Safepay checkout URL.",
    });
  }
};

module.exports = {
  createSafepayTracker,
  createSafepayCheckoutUrl,
};
