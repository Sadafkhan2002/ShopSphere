
import api from "./api";

// Retrieve the authenticated customer's wishlist
export const getWishlist = async () => {
  const response = await api.get("/customer/wishlist");
  return response.data;
};

// Add a product to the wishlist
export const addToWishlist = async (productId) => {
  const response = await api.post(
    `/customer/wishlist/${productId}`
  );
  return response.data;
};

// Remove a product from the wishlist
export const removeFromWishlist = async (productId) => {
  const response = await api.delete(
    `/customer/wishlist/${productId}`
  );
  return response.data;
};
