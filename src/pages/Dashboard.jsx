import React from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="page">
      <h1>Welcome {user?.first_name || ""}!</h1>
      <p>Role: <strong>{user?.role}</strong></p>
      <p>Email: <strong>{user?.email}</strong></p>

      <div className="grid">
        <div className="panel">
          <h3>Quick Actions</h3>
          <ul>
            <li>View employees</li>
            <li>Run reports</li>
            <li>Manage events</li>
          </ul>
        </div>
        <div className="panel">
          <h3>System Status</h3>
          <p>Everything looks good ✅</p>
        </div>
      </div>
    </div>
  );
}
