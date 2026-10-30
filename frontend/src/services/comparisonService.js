
import api from "./api";

// Get the logged-in customer's comparison list
export const getComparison = async () => {
  const response = await api.get("/customer/comparison");
  return response.data;
};

// Add a product to the comparison list
export const addToComparison = async (productId) => {
  const response = await api.post(`/customer/comparison/${productId}`);
  return response.data;
};

// Remove one product from comparison
export const removeFromComparison = async (productId) => {
  const response = await api.delete(`/customer/comparison/${productId}`);
  return response.data;
};

// Clear the entire comparison list
export const clearComparison = async () => {
  const response = await api.delete("/customer/comparison/clear");
  return response.data;
};
