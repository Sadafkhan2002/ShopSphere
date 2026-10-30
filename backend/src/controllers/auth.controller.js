
"use strict";

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const {
  UniqueConstraintError,
  ValidationError,
} = require("sequelize");

const User = require("../models/User");

const COOKIE_NAME = "shopsphere_access_token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const googleClient = new OAuth2Client();

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: COOKIE_MAX_AGE,
  path: "/",
});

const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      algorithm: "HS256",
    }
  );
};

const publicUser = (user) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  role: user.role,
  isEmailVerified: user.isEmailVerified,
});

// ==========================================
// CUSTOMER REGISTRATION
// POST /api/auth/register
// ==========================================

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body || {};

    if (
      typeof firstName !== "string" ||
      typeof lastName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !firstName.trim() ||
      !lastName.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      cleanFirstName.length > 100 ||
      cleanLastName.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "First name and last name cannot exceed 100 characters.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (cleanEmail.length > 255 || !emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address.",
      });
    }

    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and at most 72 bytes.",
      });
    }

    const existingUser = await User.findOne({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName: cleanFirstName,
      lastName: cleanLastName,
      email: cleanEmail,
      passwordHash,
      role: "customer",
      authProvider: "local",
      isActive: true,
      isEmailVerified: false,
    });

    return res.status(201).json({
      success: true,
      message: "Customer registered successfully.",
      data: { user: publicUser(user) },
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration information.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
};

// ==========================================
// CUSTOMER LOGIN
// POST /api/auth/login
// ==========================================

const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      where: { email: cleanEmail },
    });

    if (
      !user ||
      user.authProvider !== "local" ||
      !user.passwordHash
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact support.",
      });
    }

    const token = createToken(user);

    res.cookie(COOKIE_NAME, token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        user: publicUser(user),
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
};

// ==========================================
// GOOGLE LOGIN
// POST /api/auth/google
// ==========================================

const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body || {};

    if (
      typeof credential !== "string" ||
      !credential.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required.",
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      console.error("GOOGLE_CLIENT_ID is not configured.");

      return res.status(500).json({
        success: false,
        message: "Google login is not configured on the server.",
      });
    }

    // Verify the ID token with Google.
    let payload;

    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired Google credential.",
      });
    }

    if (
      !payload ||
      !payload.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      return res.status(401).json({
        success: false,
        message: "A verified Google account is required.",
      });
    }

    const googleId = payload.sub;
    const email = payload.email.trim().toLowerCase();

    const fullName =
      typeof payload.name === "string" ? payload.name.trim() : "";

    const nameParts = fullName
      ? fullName.split(/\s+/)
      : [];

    const firstName =
      (typeof payload.given_name === "string" &&
        payload.given_name.trim()) ||
      nameParts[0] ||
      "Google";

    const lastName =
      (typeof payload.family_name === "string" &&
        payload.family_name.trim()) ||
      nameParts.slice(1).join(" ") ||
      "User";

    if (firstName.length > 100 || lastName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Google profile name is too long.",
      });
    }

    // Find an existing Google account by its immutable Google ID.
    let user = await User.findOne({
      where: { googleId },
    });

    if (!user) {
      // Never silently convert an existing local account.
      const existingEmailUser = await User.findOne({
        where: { email },
      });

      if (existingEmailUser) {
        if (existingEmailUser.authProvider !== "google") {
          return res.status(409).json({
            success: false,
            message:
              "An account with this email already exists. Please sign in using your existing method.",
          });
        }

        // Recover an older Google account whose Google ID
        // has not yet been saved, if that situation exists.
        if (!existingEmailUser.googleId) {
          existingEmailUser.googleId = googleId;
          existingEmailUser.isEmailVerified = true;
          await existingEmailUser.save();
        } else {
          return res.status(409).json({
            success: false,
            message:
              "This email is already associated with another Google identity.",
          });
        }

        user = existingEmailUser;
      } else {
        user = await User.create({
          firstName,
          lastName,
          email,
          googleId,
          passwordHash: null,
          role: "customer",
          authProvider: "google",
          isActive: true,
          isEmailVerified: true,
        });
      }
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive. Please contact support.",
      });
    }

    const token = createToken(user);

    // Use the same cookie and JWT format as normal login.
    res.cookie(COOKIE_NAME, token, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Google login successful.",
      data: {
        token,
        user: publicUser(user),
      },
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      return res.status(409).json({
        success: false,
        message: "An account with this email or Google ID already exists.",
      });
    }

    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        message: "Invalid Google account information.",
      });
    }

    console.error("Google login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "An unexpected server error occurred.",
    });
  }
};

// ==========================================
// GET CURRENT AUTHENTICATED USER
// GET /api/auth/me
// ==========================================

const getMe = async (req, res) => {
  const user = req.user;

  res.set("Cache-Control", "no-store");

  return res.status(200).json({
    success: true,
    message: "Authenticated user retrieved successfully.",
    data: {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        authProvider: user.authProvider,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
      },
    },
  });
};

// ==========================================
// LOGOUT
// POST /api/auth/logout
// ==========================================

const logout = (req, res) => {
  clearAuthCookie(res);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

module.exports = {
  register,
  login,
  googleLogin,
  getMe,
  logout,
};
