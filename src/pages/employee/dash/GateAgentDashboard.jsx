// src/pages/employee/dash/GateAgentDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
export default function GateAgentDashboard() {
  return (
    <div className="page">
      <h2>Gate Agent</h2>
      <div className="grid">
        <div className="card"><h3>Events</h3><p>Check event info.</p><Link className="btn" to="/events">Open</Link></div>
      </div>
    </div>
  );
}
