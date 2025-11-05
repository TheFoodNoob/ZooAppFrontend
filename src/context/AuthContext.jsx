// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem("authUser") || "null"); } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem("authToken") || null);

  useEffect(() => { user  ? localStorage.setItem("authUser",  JSON.stringify(user)) : localStorage.removeItem("authUser"); }, [user]);
  useEffect(() => { token ? localStorage.setItem("authToken", token)               : localStorage.removeItem("authToken"); }, [token]);

  const loginEmployee = async (email, password) => {
    try {
      const r = await fetch(`${api}/api/employees/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        return { ok:false, error: err.error || "Login failed" };
      }
      const data = await r.json();
      setUser({ ...data.user, role: data.user.role || "employee" });
      setToken(data.token);
      return { ok:true, role:"employee" };
    } catch {
      return { ok:false, error:"Network error" };
    }
  };

  const loginCustomer = async (email, password) => {
    try {
      const r = await fetch(`${api}/api/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        return { ok:false, error: err.error || "Login failed" };
      }
      const data = await r.json();
      setUser({ ...data.user, role: "customer" });
      setToken(data.token);
      return { ok:true, role:"customer" };
    } catch {
      return { ok:false, error:"Network error" };
    }
  };

  const registerCustomer = async ({ first_name, last_name, email, password, phone }) => {
    try {
      const r = await fetch(`${api}/api/auth/register`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name, last_name, email, password, phone })
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        return { ok:false, error: err.error || "Register failed" };
      }
      const data = await r.json();
      setUser({ ...data.user, role: "customer" });
      setToken(data.token);
      return { ok:true };
    } catch {
      return { ok:false, error:"Network error" };
    }
  };

  const logout = () => { setUser(null); setToken(null); };

  const value = useMemo(() => ({
    user, token, loginEmployee, loginCustomer, registerCustomer, logout
  }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(){ return useContext(AuthContext); }
