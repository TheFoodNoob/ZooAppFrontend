// src/pages/employee/dash/SecurityDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
export default function SecurityDashboard() {
  return (
    <div className="page">
      <h2>Security Dashboard</h2>
      <div className="grid">
        <div className="card"><h3>Events</h3><p>View event times.</p><Link className="btn" to="/events">Open</Link></div>
      </div>
    </div>
  );
}
