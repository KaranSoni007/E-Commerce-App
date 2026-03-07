import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const name = localStorage.getItem("userName") || sessionStorage.getItem("userName");
    const email = localStorage.getItem("userEmail") || sessionStorage.getItem("userEmail");
    
    if (token && name && email) {
      setUser({ name, email, token });
    }
    setLoading(false);
  }, []);

  const login = (userData, rememberMe = true) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("token", "mock-jwt-token-12345");
    storage.setItem("userName", userData.name);
    storage.setItem("userEmail", userData.email);
    storage.setItem("userId", "mock-user-id");
    setUser({ ...userData, token: "mock-jwt-token-12345" });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userId");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userName");
    sessionStorage.removeItem("userEmail");
    sessionStorage.removeItem("userId");
    setUser(null);
  };

  const updateUser = (name) => {
    if (localStorage.getItem("userName")) {
      localStorage.setItem("userName", name);
    }
    if (sessionStorage.getItem("userName")) {
      sessionStorage.setItem("userName", name);
    }
    setUser((prev) => ({ ...prev, name }));
  };

  const resetPassword = (email, newPassword) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const existingUsers = JSON.parse(localStorage.getItem("mockUsers")) || [];
        const userIndex = existingUsers.findIndex((u) => u.email === email);

        if (userIndex === -1) {
          reject(new Error("No account found with this email address."));
          return;
        }

        existingUsers[userIndex].password = newPassword;
        localStorage.setItem("mockUsers", JSON.stringify(existingUsers));
        resolve();
      }, 1000);
    });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, resetPassword, loading }}>
      {children}
    </AuthContext.Provider>
  );
};