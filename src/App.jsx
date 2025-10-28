// src/App.jsx
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  NavLink,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Home from "./pages/ZooHomePage.jsx";
import Login from "./pages/Login.jsx";
import Lost from "./pages/Lost.jsx";

import Dashboard from "./pages/employee/Dashboard.jsx";
import Animals from "./pages/employee/Animals.jsx"
import CAnimals from "./pages/customer/Animals.jsx"
import Employees from "./pages/employee/Employees.jsx";
import Reports from "./pages/employee/Reports.jsx";
import EmployeeView from "./pages/employee/EmployeeView.jsx";
import EmployeeEdit from "./pages/employee/EmployeeEdit.jsx";

import Events from "./pages/employee/Events.jsx";
import EventView from "./pages/employee/EventView.jsx";
import EventEdit from "./pages/employee/EventEdit.jsx";

function Nav() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <nav className="nav">
        <div className="brand">H-Town Zoo</div>

        {user ? (
          <ul className="links">
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/employees" className={({ isActive }) => (isActive ? "active" : "")}>
                Employees
              </NavLink>
            </li>
            {user.role === "admin" && (
              <li>
                <NavLink to="/reports" className={({ isActive }) => (isActive ? "active" : "")}>
                  Reports
                </NavLink>
              </li>
            )}

            {(user.role === "admin" || user.role === "ops_manager") && (
              <li>
                <NavLink to="/events" className={({ isActive }) => (isActive ? "active" : "")}>
                  Events
                </NavLink>
              </li>
            )}

            <li>
              <button className="btn" onClick={logout}>Logout</button>
            </li>
          </ul>
        ) : (
          <ul className="links">
            <li>
              <NavLink to="/" className={({ isActive }) => (isActive ? "active" : "")}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/login" className={({ isActive }) => (isActive ? "active" : "")}>
                Login
              </NavLink>
            </li>
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
        {/* Public */}
        <Route path="/" element={<Home />} />
        {/* Public pages */}
         <Route
          path="/animals"
          element={
              <CAnimals />
          }
        />

        {/* Public login page */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
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
          path="/employees/:id"
          element={
            <ProtectedRoute>
              <EmployeeView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/animalStats"
          element={
              <Animals />
          }
        />
        <Route
          path="/employees/:id/edit"
          element={
            <ProtectedRoute>
              <EmployeeEdit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={["admin"]}>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Events (admin & ops_manager only) */}
        <Route
          path="/events"
          element={
            <ProtectedRoute roles={["admin", "ops_manager"]}>
              <Events />
            </ProtectedRoute>
          }
        />

        {/* >>> Add this route BEFORE /events/:id <<< */}
        <Route
          path="/events/new"
          element={
            <ProtectedRoute roles={["admin", "ops_manager"]}>
              <EventEdit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/events/:id"
          element={
            <ProtectedRoute roles={["admin", "ops_manager"]}>
              <EventView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/:id/edit"
          element={
            <ProtectedRoute roles={["admin", "ops_manager"]}>
              <EventEdit />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/403" 
          element={
          <Forbidden />
          } 
        />

        {/* 404 */}
        <Route path="*" element={<Lost />} />
      </Routes>
    </BrowserRouter>
  );
}
