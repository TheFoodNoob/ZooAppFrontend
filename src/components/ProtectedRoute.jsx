// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wrap any route that needs auth:
 *   <ProtectedRoute roles={['admin','keeper']}><StaffPage/></ProtectedRoute>
 * If `roles` is omitted, it only checks that a user is logged in.
 */
export default function ProtectedRoute({ children, roles }) {
  const { loading: ctxLoading, user } = useAuth();
  const location = useLocation();
  const loading = Boolean(ctxLoading);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  const isStaffArea = location.pathname.startsWith("/staff");
  // Prefer staff login when a route declares employee roles
  const preferStaffLogin = Boolean(roles && roles.length > 0);
  const loginPath = preferStaffLogin ? "/staff/login" : (isStaffArea ? "/staff/login" : "/login");

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

  if (roles) {
    const need = Array.isArray(roles) ? roles : [roles];
    if (!need.includes(user.role)) {
      return <Navigate to="/403" replace />;
    }
  }

  return children;
}
