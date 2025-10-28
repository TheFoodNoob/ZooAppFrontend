// src/pages/employee/dash/KeeperDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
export default function KeeperDashboard() {
  return (
    <div className="page">
      <h2>Keeper Dashboard</h2>
      <div className="grid">
        <div className="card"><h3>My Tasks</h3><p>View and complete tasks.</p><Link className="btn" to="/keeper">Open</Link></div>
        <div className="card"><h3>Animals</h3><p>Animal list & info.</p><Link className="btn" to="/animals">Open</Link></div>
      </div>
    </div>
  );
}
