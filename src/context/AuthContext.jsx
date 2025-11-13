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
  // STAFF JWT
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("authToken") || "";
  });

  // CUSTOMER JWT
  const [customerToken, setCustomerToken] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("customerToken") || "";
  });

  // Single "user" object used by the whole app.
  // For staff:    { employee_id,..., role: 'admin' | 'keeper' | ... }
  // For customer: { email, first_name, last_name, role: 'customer' }
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("customerSession");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [loading, setLoading] = useState(false);

  // Helper for making authenticated requests with the STAFF JWT
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

  // When the STAFF token changes, load the current employee profile
  useEffect(() => {
    let cancelled = false;
    if (!token) return;

    (async () => {
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

  // 🔐 STAFF login → /api/auth/login
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

  // 🧑‍🦱 CUSTOMER login → /api/customer-auth/login
  async function loginCustomer(email, password) {
    try {
      setLoading(true);

      const r = await fetch(`${api}/api/customer-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        return { ok: false, error: j.error || "Login failed" };
      }

      const base =
        j.customer ||
        j.user || {
          email: j.email || email,
          first_name: j.first_name,
          last_name: j.last_name,
        };

      const customerUser = {
        ...base,
        role: "customer",
      };

      setUser(customerUser);

      if (typeof window !== "undefined") {
        localStorage.setItem("customerSession", JSON.stringify(customerUser));
      }

      const tok = j.token || "";
      if (tok) {
        setCustomerToken(tok);
        if (typeof window !== "undefined") {
          localStorage.setItem("customerToken", tok);
        }
      }

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
    setCustomerToken("");
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      localStorage.removeItem("customerSession");
      localStorage.removeItem("customerToken");
      window.dispatchEvent(new Event("auth:changed"));
    }
  }

  const value = useMemo(
    () => ({
      token,          // staff token
      customerToken,  // customer token
      user,
      loading,
      setToken,          // kept for compatibility
      setCustomerToken,  // if you ever need it
      setUser,           // kept for compatibility
      authFetch,         // staff helper
      loginEmployee,
      loginCustomer,
      logout,
    }),
    [token, customerToken, user, loading, authFetch]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export default AuthProvider;
