
"use strict";

const getCustomerProfile = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Customer profile accessed successfully.",
    data: {
      id: req.user.id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

module.exports = { getCustomerProfile };
