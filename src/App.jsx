import React from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Employees from "./pages/Employees.jsx";
import Reports from "./pages/Reports.jsx";
import { useAuth } from "./context/AuthContext.jsx";

function Nav() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <nav className="nav">
        <div className="brand">Zoo Admin</div>
        {user && (
          <ul className="links">
            <li><NavLink to="/dashboard">Dashboard</NavLink></li>
            <li><NavLink to="/employees">Employees</NavLink></li>
            <li><NavLink to="/reports">Reports</NavLink></li>
            <li><button className="btn" onClick={logout}>Logout</button></li>
          </ul>
        )}
      </nav>
    </header>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <BrowserRouter>
      <Nav />
      <Routes>
        {/* Public login page */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* Home just redirects appropriately */}
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />

        {/* Protected pages */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute>
              <Employees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
