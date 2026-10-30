
"use strict";

const User = require("./User");
const Category = require("./Category");
const Product = require("./Product");
const ProductImage = require("./ProductImage");
const Cart = require("./Cart");
const CartItem = require("./CartItem");
const Wishlist = require("./Wishlist");
const WishlistItem = require("./WishlistItem");

const ProductComparison = require("./ProductComparison");
const ProductComparisonItem = require("./ProductComparisonItem");
const Review = require("./Review");
const Coupon = require("./Coupon");
const CouponUsage = require("./CouponUsage");
const Order = require("./Order");
const OrderItem = require("./OrderItem");
const Refund = require("./Refund");


// Category → Products
Category.hasMany(Product, {
  foreignKey: "categoryId",
  as: "products",
});

Product.belongsTo(Category, {
  foreignKey: "categoryId",
  as: "category",
});

// Product → Product Images
Product.hasMany(ProductImage, {
  foreignKey: "productId",
  as: "images",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

ProductImage.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

// User → Cart
User.hasOne(Cart, {
  foreignKey: "userId",
  as: "cart",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Cart.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Cart → Cart Items
Cart.hasMany(CartItem, {
  foreignKey: "cartId",
  as: "items",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

CartItem.belongsTo(Cart, {
  foreignKey: "cartId",
  as: "cart",
});

// Product → Cart Items
Product.hasMany(CartItem, {
  foreignKey: "productId",
  as: "cartItems",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

CartItem.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});
// User → Wishlist
User.hasOne(Wishlist, {
  foreignKey: "userId",
  as: "wishlist",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Wishlist.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Wishlist → Wishlist Items
Wishlist.hasMany(WishlistItem, {
  foreignKey: "wishlistId",
  as: "items",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

WishlistItem.belongsTo(Wishlist, {
  foreignKey: "wishlistId",
  as: "wishlist",
});

// Product → Wishlist Items
Product.hasMany(WishlistItem, {
  foreignKey: "productId",
  as: "wishlistItems",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

WishlistItem.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

// User → Product Comparison
User.hasOne(ProductComparison, {
  foreignKey: "userId",
  as: "productComparison",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

ProductComparison.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Product Comparison → Comparison Items
ProductComparison.hasMany(ProductComparisonItem, {
  foreignKey: "comparisonId",
  as: "items",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

ProductComparisonItem.belongsTo(ProductComparison, {
  foreignKey: "comparisonId",
  as: "comparison",
});

// Product → Comparison Items
Product.hasMany(ProductComparisonItem, {
  foreignKey: "productId",
  as: "comparisonItems",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

ProductComparisonItem.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});
// User and Review associations
User.hasMany(Review, {
  foreignKey: "userId",
  as: "reviews",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Review.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

// Product and Review associations
Product.hasMany(Review, {
  foreignKey: "productId",
  as: "reviews",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Review.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});

// ======================================
// COUPON USAGE ASSOCIATIONS
// ======================================

// One coupon can have many usage records.
Coupon.hasMany(CouponUsage, {
  foreignKey: "couponId",
  as: "usages",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

CouponUsage.belongsTo(Coupon, {
  foreignKey: "couponId",
  as: "coupon",
});

// One customer can have many coupon usage records.
User.hasMany(CouponUsage, {
  foreignKey: "userId",
  as: "couponUsages",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

CouponUsage.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});


 // ======================================
 // ORDER AND ORDER ITEM ASSOCIATIONS
 // ======================================

// One customer can place many orders.
User.hasMany(Order, {
  foreignKey: "userId",
  as: "orders",
});

Order.belongsTo(User, {
  foreignKey: "userId",
  as: "customer",
});

// One order can contain many order items.
Order.hasMany(OrderItem, {
  foreignKey: "orderId",
  as: "items",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

OrderItem.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

// One product can appear in many order items.
Product.hasMany(OrderItem, {
  foreignKey: "productId",
  as: "orderItems",
});

OrderItem.belongsTo(Product, {
  foreignKey: "productId",
  as: "product",
});
// ======================================
// REFUND ASSOCIATIONS
// ======================================

Order.hasMany(Refund, {
  foreignKey: "orderId",
  as: "refunds",
});

Refund.belongsTo(Order, {
  foreignKey: "orderId",
  as: "order",
});

User.hasMany(Refund, {
  foreignKey: "userId",
  as: "refunds",
});

Refund.belongsTo(User, {
  foreignKey: "userId",
  as: "customer",
});

User.hasMany(Refund, {
  foreignKey: "processedBy",
  as: "processedRefunds",
});

Refund.belongsTo(User, {
  foreignKey: "processedBy",
  as: "processor",
});


module.exports = {
  User,
  Category,
  Product,
  ProductImage,
  Cart,
  CartItem,
  Wishlist,
  WishlistItem,
  ProductComparison,
  ProductComparisonItem,
  Review,
  Coupon,
  CouponUsage,
  Order,
  OrderItem,
  Refund,
};

