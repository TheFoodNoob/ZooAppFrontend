// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Wrap any route that needs auth:
 *   Staff:  <ProtectedRoute roles={['admin','keeper']}><StaffPage/></ProtectedRoute>
 *   Customer: <ProtectedRoute requireCustomer><MyAccount/></ProtectedRoute>
 */
export default function ProtectedRoute({ children, roles, requireCustomer }) {
  const { loading: ctxLoading, user } = useAuth();
  const location = useLocation();
  const loading = Boolean(ctxLoading);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;

  // ------ CUSTOMER-ONLY ROUTES ------
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

  // ------ STAFF ROUTES (roles-based) ------
  const isStaffArea = location.pathname.startsWith("/staff");
  const preferStaffLogin = Boolean(roles && roles.length > 0);
  const loginPath =
    preferStaffLogin || isStaffArea ? "/staff/login" : "/login";

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
