// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { endpoints } from "../api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  function persist(nextToken, nextUser) {
    setToken(nextToken || "");
    setUser(nextUser || null);
    if (nextToken) localStorage.setItem("token", nextToken); else localStorage.removeItem("token");
    if (nextUser) localStorage.setItem("user", JSON.stringify(nextUser)); else localStorage.removeItem("user");
  }

  async function login(email, password) {
    setLoading(true);
    try {
      // 1) exchange credentials for token
      const r1 = await fetch(endpoints.auth.login(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j1 = await r1.json().catch(() => ({}));
      if (!r1.ok || !j1.token) throw new Error(j1.error || "Login failed");

      const tok = j1.token;

      // 2) fetch canonical profile (id, name, role, email)
      const r2 = await fetch(endpoints.auth.me(), {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const j2 = await r2.json().catch(() => ({}));
      if (!r2.ok) throw new Error(j2.error || "Failed to fetch profile");

      persist(tok, j2);
      return { ok: true };
    } catch (e) {
      logout();
      return { ok: false, error: e.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    persist("", null);
  }

  // try to rehydrate on first load (if we have a token but no user)
  useEffect(() => {
    let ignore = false;
    (async () => {
      if (!token || user) return;
      try {
        const r = await fetch(endpoints.auth.me(), { headers: { Authorization: `Bearer ${token}` } });
        const j = await r.json().catch(() => ({}));
        if (r.ok && !ignore) setUser(j);
        if (!r.ok) logout();
      } catch {
        logout();
      }
    })();
    return () => { ignore = true; };
  }, [token, user]);

  const value = useMemo(() => ({
    token, user, loading, login, logout
  }), [token, user, loading]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  return useContext(AuthCtx);
}
