import React from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Login from "./pages/Login.jsx";
import Lost from "./pages/Lost.jsx"
import Dashboard from "./pages/employee/Dashboard.jsx";
import Animals from "./pages/employee/Animals.jsx"
import CAnimals from "./pages/customer/Animals.jsx"
import Employees from "./pages/employee/Employees.jsx";
import Reports from "./pages/employee/Reports.jsx";
import Home from "./pages/ZooHomePage.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import EmployeeView from "./pages/employee/EmployeeView.jsx";
import EmployeeEdit from "./pages/employee/EmployeeEdit.jsx";

function Nav() {
  const { user, logout } = useAuth();

  return (
    <header className="topbar">
      <nav className="nav">
        <div className="brand">H-Town Zoo</div>
        {user ? (
          
          <ul className="links">
            <li><NavLink to="/dashboard">Dashboard</NavLink></li>
            <li><NavLink to="/employees">Employees</NavLink></li>
            <li><NavLink to="/reports">Reports</NavLink></li>
            <li><button className="btn" onClick={logout}>Logout</button></li>
          </ul>
          
        ) : (
          <ul className="links">
            <li><NavLink to = "/">Home</NavLink></li>
            <li><NavLink to="/login">Login</NavLink></li>
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
        {/* Home just redirects appropriately */}
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
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Catch-all */}
        <Route path="*"
         element={<Lost/>}
        />
      </Routes>
    </BrowserRouter>
  );
}
