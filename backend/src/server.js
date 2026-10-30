
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const sequelize = require("./config/database");

const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const customerRoutes = require("./routes/customer.routes");
const categoryRoutes = require("./routes/category.routes");
const productRoutes = require("./routes/product.routes");
const productImageRoutes = require("./routes/productImage.routes");
const cartRoutes = require("./routes/cart.routes");
const wishlistRoutes = require("./routes/wishlist.routes");
const productComparisonRoutes = require("./routes/productComparison.routes");
const reviewRoutes = require("./routes/review.routes");

const app = express();

// Allow the React frontend to send authentication cookies.
const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// NOTE:
// When Stripe webhooks are implemented, register their route here,
// BEFORE express.json(), using express.raw({ type: "application/json" }).
// Stripe signature verification requires the original request body.

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Parse incoming cookies.
app.use(cookieParser());

// Authentication
app.use("/api/auth", authRoutes);

// Admin
app.use("/api/admin", adminRoutes);

// Customer
app.use("/api/customer", customerRoutes);

// Categories
app.use("/api/categories", categoryRoutes);

// Products
app.use("/api/products", productRoutes);
app.use("/api/products", productImageRoutes);

// Cart
app.use("/api/cart", cartRoutes);

// Wishlist
app.use("/api/customer/wishlist", wishlistRoutes);

// Product comparison
app.use("/api/customer/comparison", productComparisonRoutes);

// Reviews
app.use("/api", reviewRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the ShopSphere API",
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ShopSphere API is running",
    timestamp: new Date().toISOString(),
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();

    console.log(
      "MySQL database connection established successfully."
    );

    app.listen(PORT, () => {
      console.log(`ShopSphere API running on port ${PORT}`);
    });
  
  } catch (error) {
    console.error(
      "Unable to connect to the database:",
      error.message
    );

    process.exit(1);
  }

}

startServer();
