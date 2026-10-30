
"use strict";

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // The authenticate middleware must run first.
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication is required.",
      });
    }

    // Check whether the logged-in user has an allowed role.
    
      // Check the authenticated user's role.
      console.log("Authorization diagnostic:", {
        userId: req.user.id,
        email: req.user.email,
        role: req.user.role,
        allowedRoles,
      });

      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "You do not have permission to access this resource.",
        });
      }


    next();
  };
};

module.exports = { authorizeRoles };
