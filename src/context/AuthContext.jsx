// src/context/AuthContext.jsx
import React, { createContext, useContext, useCallback, useEffect, useState } from "react";
import { api } from "../api";

const AuthCtx = createContext(null);

// Named hook export (works with: import { useAuth } from "...")
export function useAuth() {
  return useContext(AuthCtx);
}

// Named provider export (works with: import { AuthProvider } from "...")
export function AuthProvider({ children }) {
  const [token, setToken]   = useState(() => localStorage.getItem("authToken") || "");
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(false);

  // Authorized fetch helper
  const authFetch = useCallback(
    async (url, opts = {}) => {
      const headers = { ...(opts.headers || {}), Authorization: `Bearer ${token}` };
      return fetch(url, { ...opts, headers });
    },
    [token]
  );

  // Load current employee when token changes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        setUser(null);
        return;
      }
      try {
        const r = await authFetch(`${api}/api/employee/me`);
        if (!r.ok) throw new Error("Auth check failed");
        const me = await r.json();
        if (!cancelled) setUser(me || null);
      } catch {
        if (!cancelled) {
          setUser(null);
          setToken("");
          localStorage.removeItem("authToken");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [token, authFetch]);

  // STAFF login → /api/auth/login (NOT /api/employees/login)
  async function loginEmployee(email, password) {
    try {
      setLoading(true);
      const r = await fetch(`${api}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return { ok: false, error: j.error || "Login failed" };

      const tok = j.token;
      setToken(tok);
      localStorage.setItem("authToken", tok);

      // fetch staff profile
      const meRes = await fetch(`${api}/api/employee/me`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const me = await meRes.json().catch(() => ({}));
      setUser(me || null);

      window.dispatchEvent(new Event("auth:changed"));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    setUser(null);
    setToken("");
    localStorage.removeItem("authToken");
    window.dispatchEvent(new Event("auth:changed"));
  }

  const value = {
    token,
    user,
    loading,
    setToken,         // kept for compatibility
    setUser,          // kept for compatibility
    authFetch,
    loginEmployee,
    logout,
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// Also export default for projects that import default:
//   import AuthProvider from "...";
export default AuthProvider;
