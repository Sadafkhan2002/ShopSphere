
"use strict";

const express = require("express");

const {
  register,
  login,
  googleLogin,
  getMe,
  logout,
} = require("../controllers/auth.controller");

const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

// Register a customer
router.post("/register", register);

// Login with email and password
router.post("/login", login);

// Login with Google Identity Services
router.post("/google", googleLogin);

// Logout and clear the authentication cookie
router.post("/logout", logout);

// Retrieve the authenticated user's profile
router.get("/me", authenticate, getMe);

module.exports = router;
