// src/components/ProtectedRoute.jsx
import React from "react";

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;

  // if roles array provided, enforce
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
