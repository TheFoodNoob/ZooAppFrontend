// src/pages/Dashboard.jsx
import React from "react";

import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();
  return (
    <div className="center">
      <div className="card">
        <h1>Welcome, {user?.first_name} {user?.last_name}</h1>
        <p>Role: <strong>{user?.role}</strong></p>
        <p>Email: {user?.email}</p>
        <button onClick={logout}>Log out</button>
      </div>
    </div>
  );
}
