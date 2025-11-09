// src/hooks/useVerifyStatus.js
import React from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

export default function useVerifyStatus() {
  const { token, user } = useAuth();
  const [state, setState] = React.useState({ loading: !!token, verified: false, error: "" });

  React.useEffect(() => {
    let ignore = false;
    async function run() {
      if (!token) {
        setState({ loading: false, verified: false, error: "" });
        return;
      }
      try {
        const r = await fetch(`${api}/api/auth/verify/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!r.ok) throw new Error("Failed to load verification status");
        const { verified } = await r.json();
        if (!ignore) setState({ loading: false, verified: !!verified, error: "" });
      } catch (e) {
        if (!ignore) setState({ loading: false, verified: false, error: e.message || "Failed" });
      }
    }
    run();
    return () => { ignore = true; };
  }, [token]);

  return { ...state, user };
}
