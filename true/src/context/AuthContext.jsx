import React, { createContext, useState, useEffect, useContext } from "react";

// Create Auth Context
export const AuthContext = createContext();

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem("token");
        const storedUser = localStorage.getItem("user");

        if (storedToken && storedUser) {
          // Verify token is still valid with backend
          try {
            const res = await fetch("http://127.0.0.1:8000/verify-token/", {
              method: "GET",
              headers: {
                "Authorization": `Bearer ${storedToken}`,
                "Content-Type": "application/json",
              },
            });

            if (res.ok) {
              setToken(storedToken);
              setUser(JSON.parse(storedUser));
            } else {
              // Token is invalid, clear storage
              clearAuthData();
            }
          } catch (error) {
            console.error("Token verification failed:", error);
            clearAuthData();
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        clearAuthData();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Save token to localStorage when it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    } else {
      localStorage.removeItem("token");
    }
  }, [token]);

  // Save user to localStorage when it changes
  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  // Clear all auth data
  const clearAuthData = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  };

  // Login function
  const login = (tokenValue, userData = null) => {
    setToken(tokenValue);
    setUser(userData);
  };

  // Logout function
  const logout = () => {
    // Optional: Call backend logout endpoint
    if (token) {
      fetch("http://127.0.0.1:8000/logout/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).catch(error => {
        console.error("Logout API call failed:", error);
      });
    }
    
    clearAuthData();
  };

  // Update user profile
  const updateUser = (userData) => {
    setUser(prevUser => ({ ...prevUser, ...userData }));
  };

  // Check if user is authenticated
  const isAuthenticated = !!token;

  // Refresh token function (if you implement token refresh)
  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const res = await fetch("http://127.0.0.1:8000/token/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (res.ok) {
        const data = await res.json();
        setToken(data.access);
        localStorage.setItem("token", data.access);
        return data.access;
      } else {
        throw new Error("Token refresh failed");
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      logout();
      throw error;
    }
  };

  // Context value
  const contextValue = {
    token,
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateUser,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;