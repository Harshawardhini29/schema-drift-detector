/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from "react";
import { login, register, getMe } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const response = await getMe();
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          console.error("Failed to load user info:", error);
          // Token is likely expired or invalid, clear it
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const loginUser = async (username, password) => {
    try {
      const response = await login({ username, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem("token", access_token);
      setToken(access_token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error("Login failed:", error);
      const detail = error.response?.data?.detail || "Invalid credentials. Please try again.";
      return { success: false, message: detail };
    }
  };

  const registerUser = async (username, email, password) => {
    try {
      const response = await register({ username, email, password });
      const { access_token, user: userData } = response.data;

      localStorage.setItem("token", access_token);
      setToken(access_token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error("Registration failed:", error);
      const detail = error.response?.data?.detail || "Registration failed. Please try again.";
      return { success: false, message: detail };
    }
  };

  const logoutUser = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    loginUser,
    registerUser,
    logoutUser,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
