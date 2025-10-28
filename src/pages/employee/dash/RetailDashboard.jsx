// src/pages/employee/dash/RetailDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
export default function RetailDashboard() {
  return (
    <div className="page">
      <h2>Retail Dashboard</h2>
      <div className="grid">
        <div className="card"><h3>Events</h3><p>See upcoming events.</p><Link className="btn" to="/events">Open</Link></div>
      </div>
    </div>
  );
}
