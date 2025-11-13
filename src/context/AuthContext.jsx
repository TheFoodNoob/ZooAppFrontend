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
  /* ---------- STAFF JWT (NOW sessionStorage-based) ---------- */
  const [token, setToken] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      // Prefer sessionStorage so staff login dies when browser/tab closes
      const fromSession = window.sessionStorage.getItem("authToken");
      if (fromSession) return fromSession;

      // Fallback: if we previously stored it in localStorage, use it once
      const fromLocal = window.localStorage.getItem("authToken");
      return fromLocal || "";
    } catch {
      return "";
    }
  });

  /* ---------- CUSTOMER JWT (sessionStorage-based) ---------- */
  const [customerToken, setCustomerToken] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const fromSession = window.sessionStorage.getItem("customerToken");
      if (fromSession) return fromSession;

      const fromLocal = window.localStorage.getItem("customerToken");
      return fromLocal || "";
    } catch {
      return "";
    }
  });

  /* ---------- Single user object (staff OR customer) ---------- */
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;

    try {
      // Prefer sessionStorage for customers
      const sessionVal = window.sessionStorage.getItem("customerSession");
      if (sessionVal) {
        return JSON.parse(sessionVal);
      }

      // Fallback to old localStorage (in case of existing data)
      const stored = window.localStorage.getItem("customerSession");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore parse errors
    }

    // Staff user will be loaded via /api/employee/me when staff token is set
    return null;
  });

  const [loading, setLoading] = useState(false);

  // Helper for making authenticated STAFF requests with the STAFF JWT
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

  /* ---------- Load staff profile when STAFF token changes ---------- */
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
          setUser(null);
          setToken("");
          if (typeof window !== "undefined") {
            // clean up both storages for safety
            window.sessionStorage.removeItem("authToken");
            window.localStorage.removeItem("authToken");
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, authFetch]);

  /* ---------- STAFF login ---------- */
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
        // ✅ now: store in sessionStorage, not localStorage
        window.sessionStorage.setItem("authToken", tok);
        // clear any old persistent value
        window.localStorage.removeItem("authToken");
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

  /* ---------- CUSTOMER login ---------- */
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

      const tok = j.token || "";
      setCustomerToken(tok);

      if (typeof window !== "undefined") {
        // ✅ customer: sessionStorage only
        window.sessionStorage.setItem(
          "customerSession",
          JSON.stringify(customerUser)
        );
        if (tok) {
          window.sessionStorage.setItem("customerToken", tok);
        }

        // Clean up any old localStorage values from previous implementation
        window.localStorage.removeItem("customerSession");
        window.localStorage.removeItem("customerToken");

        window.dispatchEvent(new Event("auth:changed"));
      }

      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  }

  /* ---------- Logout (staff + customer) ---------- */
  function logout() {
    setUser(null);
    setToken("");
    setCustomerToken("");

    if (typeof window !== "undefined") {
      // Staff tokens
      window.sessionStorage.removeItem("authToken");
      window.localStorage.removeItem("authToken");

      // Customer – both the new session-based and old local-based keys
      window.localStorage.removeItem("customerSession");
      window.localStorage.removeItem("customerToken");
      window.sessionStorage.removeItem("customerSession");
      window.sessionStorage.removeItem("customerToken");

      window.dispatchEvent(new Event("auth:changed"));
    }
  }

  const value = useMemo(
    () => ({
      token, // staff token
      customerToken, // customer token
      user,
      loading,
      setToken,
      setCustomerToken,
      setUser,
      authFetch, // staff helper
      loginEmployee,
      loginCustomer,
      logout,
    }),
    [token, customerToken, user, loading, authFetch]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export default AuthProvider;
