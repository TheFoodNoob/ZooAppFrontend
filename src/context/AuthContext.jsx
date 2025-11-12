// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  useMemo,
} from "react";
import { api } from "../api";

const AuthCtx = createContext(null);

// Hook: useAuth()
export function useAuth() {
  return useContext(AuthCtx);
}

// Provider: AuthProvider
export function AuthProvider({ children }) {
  // Safely read initial token from localStorage (browser only)
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("authToken") || "";
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Helper for making authenticated requests with the staff JWT
  const authFetch = useCallback(
    async (url, opts = {}) => {
      const headers = {
        ...(opts.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
      return fetch(url, { ...opts, headers });
    },
    [token]
  );

  // When the staff token changes, try to load the current employee profile
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

        const me = await r.json().catch(() => ({}));
        if (!cancelled) setUser(me || null);
      } catch {
        if (!cancelled) {
          // Token invalid/expired → clear it out
          setUser(null);
          setToken("");
          if (typeof window !== "undefined") {
            localStorage.removeItem("authToken");
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, authFetch]);

  // STAFF login → /api/auth/login
  async function loginEmployee(email, password) {
    try {
      setLoading(true);

      const r = await fetch(`${api}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        return { ok: false, error: j.error || "Login failed" };
      }

      const tok = j.token;
      setToken(tok);
      if (typeof window !== "undefined") {
        localStorage.setItem("authToken", tok);
      }

      // Load staff profile immediately after login
      const meRes = await fetch(`${api}/api/employee/me`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const me = await meRes.json().catch(() => ({}));
      setUser(me || null);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth:changed"));
      }

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
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      window.dispatchEvent(new Event("auth:changed"));
    }
  }

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      setToken, // kept for compatibility
      setUser,  // kept for compatibility
      authFetch,
      loginEmployee,
      logout,
    }),
    [token, user, loading, authFetch]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// Default export kept for compatibility:
//   import AuthProvider from "...";
export default AuthProvider;
