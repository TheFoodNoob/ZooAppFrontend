import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { loading, user } = useAuth();

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  if (!user) return <Navigate to="/login" replace />;

  if (roles && roles.length && !roles.includes(user.role)) {
    return <div style={{ padding: 24 }}>Forbidden (role: {user.role})</div>;
  }

  return children;
}
