
"use strict";

const getAdminDashboard = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Welcome to the ShopSphere admin dashboard.",
    admin: {
      id: req.user.id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

module.exports = { getAdminDashboard };
