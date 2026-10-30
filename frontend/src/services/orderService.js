import api from "./api";

// Create an order using the authenticated customer's cart.
export const createOrder = async (shippingDetails) => {
  const response = await api.post(
    "/customer/orders",
    shippingDetails
  );

  return response.data;
};

// Get all orders belonging to the current customer.
export const getMyOrders = async () => {
  const response = await api.get("/customer/orders");
  return response.data;
};

// Get details of one order.
export const getMyOrderById = async (orderId) => {
  const response = await api.get(`/customer/orders/${orderId}`);
  return response.data;
};

// Cancel an eligible order.
export const cancelMyOrder = async (orderId) => {
  const response = await api.patch(
    `/customer/orders/${orderId}/cancel`
  );

  return response.data;
};

// Complete the project's simulated demo payment.
// This does not charge real money.
export const simulatePayment = async (orderId) => {
  const response = await api.post(
    `/customer/orders/${orderId}/pay`
  );

  return response.data;
};

// Initialize Safepay sandbox payment.
export const createSafepayTracker = async (orderId) => {
  const response = await api.post(
    `/customer/orders/${orderId}/safepay`
  );

  return response.data;
};

// Request the Safepay checkout URL.
export const createSafepayCheckoutUrl = async (orderId) => {
  const response = await api.post(
    `/customer/orders/${orderId}/safepay/checkout`
  );

  return response.data;
};