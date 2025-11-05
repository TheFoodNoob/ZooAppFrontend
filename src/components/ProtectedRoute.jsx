// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { loading: ctxLoading, user } = useAuth();
  const location = useLocation();
  const loading = Boolean(ctxLoading); // tolerate undefined

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  if (!user) {
    // preserve where they tried to go
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles) {
    const need = Array.isArray(roles) ? roles : [roles];
    if (!need.includes(user.role)) {
      return <Navigate to="/403" replace />;
    }
  }

  return children;
}
