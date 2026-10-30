"use strict";

const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticate = async (req, res, next) => {
  try {
    // Prefer the HttpOnly cookie.
    // Keep Bearer-token support for Postman and existing frontend requests.
    const cookieToken = req.cookies?.shopsphere_access_token;

    const authorization = req.headers.authorization;

    let token = cookieToken;
    let tokenSource = "cookie";

    if (!token && authorization?.startsWith("Bearer ")) {
      token = authorization.slice(7).trim();
      tokenSource = "bearer";
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "The account associated with this token no longer exists.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact support.",
      });
    }

    req.user = user;
    req.authTokenSource = tokenSource;

    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is invalid or expired.",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      success: false,
      message: "An unexpected authentication error occurred.",
    });
  }
};

module.exports = { authenticate };