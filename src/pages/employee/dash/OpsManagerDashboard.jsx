// src/pages/employee/dash/OpsManagerDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
export default function OpsManagerDashboard() {
  return (
    <div className="page">
      <h2>Operations Manager</h2>
      <div className="grid">
        <div className="card"><h3>Events</h3><p>Plan and manage events.</p><Link className="btn" to="/events">Open</Link></div>
        <div className="card"><h3>Keeper Tasks</h3><p>Assign & review tasks.</p><Link className="btn" to="/keeper">Open</Link></div>
        <div className="card"><h3>Reports</h3><p>Operational overview.</p><Link className="btn" to="/reports">Open</Link></div>
      </div>
    </div>
  );
}
