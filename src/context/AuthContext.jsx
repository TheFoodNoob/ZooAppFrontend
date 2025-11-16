// src/context/AuthContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { api } from "../api";

const AuthCtx = createContext(null);

// Hook: useAuth
export function useAuth() {
  return useContext(AuthCtx);
}

// Provider: AuthProvider
export function AuthProvider({ children }) {
  const [token, setToken] = useState("");
  const [customerToken, setCustomerToken] = useState("");
  const [user, setUser] = useState(null);

  // <-- initializing state tracks loading during first auth check -->
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  // Helper for staff requests
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

  // Load tokens and user on first render
  useEffect(() => {
    const init = async () => {
      try {
        // Load staff token
        const sessionStaff = typeof window !== "undefined" ? window.sessionStorage.getItem("authToken") : null;
        const localStaff = typeof window !== "undefined" ? window.localStorage.getItem("authToken") : null;
        const staffToken = sessionStaff || localStaff || "";
        setToken(staffToken);

        // Load customer token
        const sessionCustomer = typeof window !== "undefined" ? window.sessionStorage.getItem("customerToken") : null;
        const localCustomer = typeof window !== "undefined" ? window.localStorage.getItem("customerToken") : null;
        const custToken = sessionCustomer || localCustomer || "";
        setCustomerToken(custToken);

        // Load user from customer session
        let storedUser = null;
        if (typeof window !== "undefined") {
          const custSession = window.sessionStorage.getItem("customerSession");
          const localSession = window.localStorage.getItem("customerSession");
          if (custSession) storedUser = JSON.parse(custSession);
          else if (localSession) storedUser = JSON.parse(localSession);
        }

        setUser(storedUser);

        // If staff token exists, fetch staff profile
        if (staffToken) {
          const res = await fetch(`${api}/api/employee/me`, {
            headers: { Authorization: `Bearer ${staffToken}` },
          });
          if (res.ok) {
            const me = await res.json();
            setUser(me);
          } else {
            setToken("");
            if (typeof window !== "undefined") {
              window.sessionStorage.removeItem("authToken");
              window.localStorage.removeItem("authToken");
            }
          }
        }
      } catch {
        setUser(null);
        setToken("");
        setCustomerToken("");
      } finally {
        setInitializing(false); // auth check finished
      }
    };

    init();
  }, []);

  // Staff login
  const loginEmployee = async (email, password) => {
    setLoading(true);
    try {
      const r = await fetch(`${api}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json();
      if (!r.ok) return { ok: false, error: j.error || "Login failed" };

      const tok = j.token;
      setToken(tok);
      if (typeof window !== "undefined") window.sessionStorage.setItem("authToken", tok);

      const meRes = await fetch(`${api}/api/employee/me`, {
        headers: { Authorization: `Bearer ${tok}` },
      });
      const me = await meRes.json();
      setUser(me || null);

      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  // Customer login
  const loginCustomer = async (email, password) => {
    setLoading(true);
    try {
      const r = await fetch(`${api}/api/customer-auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const j = await r.json();
      if (!r.ok) return { ok: false, error: j.error || "Login failed" };

      const customerUser = { ...(j.customer || j.user || {}), role: "customer" };
      setUser(customerUser);
      const tok = j.token || "";
      setCustomerToken(tok);

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem("customerSession", JSON.stringify(customerUser));
        if (tok) window.sessionStorage.setItem("customerToken", tok);
      }

      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || "Login failed" };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken("");
    setCustomerToken("");

    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem("authToken");
      window.sessionStorage.removeItem("customerToken");
      window.sessionStorage.removeItem("customerSession");
      window.localStorage.removeItem("authToken");
      window.localStorage.removeItem("customerToken");
      window.localStorage.removeItem("customerSession");
    }
  };

  const value = useMemo(
    () => ({
      token,
      customerToken,
      user,
      loading,
      initializing,
      authFetch,
      loginEmployee,
      loginCustomer,
      logout,
    }),
    [token, customerToken, user, loading, initializing, authFetch]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export default AuthProvider;
