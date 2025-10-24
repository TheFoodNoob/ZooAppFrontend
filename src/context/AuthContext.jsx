import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken]   = useState(null);
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true); // blocks UI until we know

  // Load token from storage on first mount, then fetch /me
  useEffect(() => {
    const stored = localStorage.getItem("jwt");
    if (!stored) {
      setLoading(false);
      return;
    }
    setToken(stored);
    fetchMe(stored).finally(() => setLoading(false));
  }, []);

  async function fetchMe(tok) {
    try {
      const res = await fetch(`${api}/api/employee/me`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      if (res.status === 401) {
        // invalid/expired token
        logout();
        return;
      }
      const data = await res.json();
      setUser(data);
    } catch (e) {
      console.error("Failed to fetch /me:", e);
    }
  }
// TODO:: SET ROLES TO LOGIN EX: "Customer","Employee"
  async function login(email, password, role) {
    //API CALL to post
    const res = await fetch(`${api}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Login failed");
    }

    const { token: jwt } = await res.json();
    //sets token
    localStorage.setItem("jwt", jwt);
    setToken(jwt);
    //fetches token if returns w/o error return true
    await fetchMe(jwt);
    return true;
  }

  function logout() {
  localStorage.removeItem("jwt");
  setToken(null);
  setUser(null);
}

  const value = { token, user, loading, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
