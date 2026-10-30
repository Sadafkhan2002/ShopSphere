import api from "./api";

// Login using email and password.
export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials, {
    withCredentials: true,
  });

  return response.data;
};

// Login using Google Identity Services.
export const googleLogin = async (credential) => {
  const response = await api.post(
    "/auth/google",
    { credential },
    { withCredentials: true }
  );

  return response.data;
};

// Register a new customer.
export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData, {
    withCredentials: true,
  });

  return response.data;
};

// Fetch the currently authenticated user.
export const fetchCurrentUser = async () => {
  const response = await api.get("/auth/me", {
    withCredentials: true,
  });

  return response.data;
};

// Log out and clear the server authentication cookie.
export const logoutFromServer = async () => {
  const response = await api.post(
    "/auth/logout",
    {},
    { withCredentials: true }
  );

  return response.data;
};