// src/App.jsx
import React from "react";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute /* roles={['admin','keeper','vet']} */>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<div style={{ padding: 32 }}>Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
