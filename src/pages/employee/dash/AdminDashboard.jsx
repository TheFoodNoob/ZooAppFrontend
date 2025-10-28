// src/pages/employee/dash/AdminDashboard.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div className="page">
      <h2>Admin Dashboard</h2>
      <div className="grid">
        <div className="card"><h3>Employees</h3><p>Manage employees.</p><Link className="btn" to="/employees">Open</Link></div>
        <div className="card"><h3>Events</h3><p>Create & edit events.</p><Link className="btn" to="/events">Open</Link></div>
        <div className="card"><h3>Reports</h3><p>Headcount, animals, payroll.</p><Link className="btn" to="/reports">Open</Link></div>
      </div>
    </div>
  );
}
