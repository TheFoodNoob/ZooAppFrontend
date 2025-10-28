// src/pages/employee/dash/CoordinatorDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
export default function CoordinatorDashboard() {
  return (
    <div className="page">
      <h2>Coordinator Dashboard</h2>
      <div className="grid">
        <div className="card"><h3>Events</h3><p>Coordinate schedules.</p><Link className="btn" to="/events">Open</Link></div>
      </div>
    </div>
  );
}
