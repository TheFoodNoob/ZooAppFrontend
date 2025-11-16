// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, roles, requireCustomer }) {
  const { user, initializing } = useAuth();
  const location = useLocation();

  // Show loading while auth context initializes
  if (initializing) {
    return <div style={{ padding: 24 }}>Loading…</div>;
  }

  // ---------- CUSTOMER-ONLY ROUTES ----------
  if (requireCustomer) {
    if (!user || user.role !== "customer") {
      return (
        <Navigate
          to="/login"
          replace
          state={{
            from: location,
            flash: { type: "info", message: "Please log in to continue." },
          }}
        />
      );
    }
    return children;
  }

  // ---------- STAFF ROUTES (roles-based) ----------
  const isStaffArea = location.pathname.startsWith("/staff");
  const preferStaffLogin = Boolean(roles && roles.length > 0);
  const loginPath = preferStaffLogin || isStaffArea ? "/staff/login" : "/login";

  if (!user) {
    return (
      <Navigate
        to={loginPath}
        replace
        state={{
          from: location,
          flash: { type: "info", message: "Please log in to continue." },
        }}
      />
    );
  }

  // Role-based access
  if (roles) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/403" replace />;
    }
  }

  return children;
}
