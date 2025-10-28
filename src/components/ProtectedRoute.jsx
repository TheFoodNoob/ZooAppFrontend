// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { token, user } = useAuth();

  // not logged in → send to login
  if (!token) return <Navigate to="/login" replace />;

  // role-restricted?
  if (Array.isArray(roles) && roles.length > 0) {
    const allowed = user && roles.includes(user.role);
    if (!allowed) return <Navigate to="/403" replace />;
  }

  return children;
}
