
import {
  fetchCurrentUser,
  logoutFromServer,
} from "../services/authService";

const USER_KEY = "shopsphere_user";

export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const saveCurrentUser = (user) => {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch (error) {
    console.error("Unable to update the local user:", error);
  }
};

export const isAuthenticated = () => {
  // A local UI hint only. The backend must validate authentication.
  return Boolean(getCurrentUser());
};

export const verifyCurrentUser = async () => {
  try {
    const response = await fetchCurrentUser();

    // Support both direct and nested API response formats.
    const user =
      response?.data?.user ??
      response?.user ??
      null;

    const success = response?.success ?? true;

    if (!success || !user) {
      saveCurrentUser(null);
      return null;
    }

    saveCurrentUser(user);
    return user;
  } catch {
  saveCurrentUser(null);
  return null;
}
};

export const logoutUser = async () => {
  try {
    await logoutFromServer();
  } finally {
    // Always clear the local user, even if the server request fails.
    saveCurrentUser(null);
  }
};
