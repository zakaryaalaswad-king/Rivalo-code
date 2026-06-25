import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = checking, false = anon, object = user

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
      return data;
    } catch (err) {
      // 401 here is the normal "not logged in" path; only log unexpected errors.
      if (err?.response?.status && err.response.status !== 401) {
        console.error("Auth refresh failed", err);
      }
      setUser(false);
      return null;
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    if (data.token) sessionStorage.setItem("ab_token", data.token);
    setUser(data.user);
    return data.user;
  };
  const register = async (email, password, name) => {
    const { data } = await api.post("/auth/register", { email, password, name });
    if (data.token) sessionStorage.setItem("ab_token", data.token);
    setUser(data.user);
    return data.user;
  };
  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (err) { console.error("Logout request failed", err); }
    sessionStorage.removeItem("ab_token");
    setUser(false);
  };

  return <AuthContext.Provider value={{ user, setUser, login, register, logout, refresh }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
