// src/pages/employee/dash/VetDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
export default function VetDashboard() {
  return (
    <div className="page">
      <h2>Vet Dashboard</h2>
      <div className="grid">
        <div className="card"><h3>Animals</h3><p>View animals.</p><Link className="btn" to="/animals">Open</Link></div>
        <div className="card"><h3>Events</h3><p>View schedules.</p><Link className="btn" to="/events">Open</Link></div>
      </div>
    </div>
  );
}
