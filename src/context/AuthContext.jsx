import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/services";
import { setToken } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("settleflow-user");
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    const token = localStorage.getItem("settleflow-token");
    if (token) {
      setToken(token);
    }
    setLoading(false);
  }, []);

  const login = async (payload) => {
    const response = await authApi.login(payload);
    const { token, user: loggedInUser } = response.data.data;
    localStorage.setItem("settleflow-token", token);
    localStorage.setItem("settleflow-user", JSON.stringify(loggedInUser));
    setToken(token);
    setUser(loggedInUser);
    return loggedInUser;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.warn("Logout request failed", error);
    }
    localStorage.removeItem("settleflow-token");
    localStorage.removeItem("settleflow-user");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      loading,
      user,
      login,
      logout,
      setUser
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}