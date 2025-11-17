// src/pages/employee/Dashboard.jsx
import React from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="page">
        <h2>Loading…</h2>
      </div>
    );
  }

  const role = user.role;

  const goToMyRole = () => {
    const map = {
      admin: "/admin",
      keeper: "/keeper",
      vet: "/vet",
      gate_agent: "/gate",
      ops_manager: "/ops",
      retail: "/retail",
      coordinator: "/coord",
      security: "/security",
    };
    const dest = map[role] || "/dashboard";
    navigate(dest);
  };

  return (
    <div className="page">
      <h1 style={{ marginBottom: 4 }}>
        Welcome back, {user.first_name || "staff"}!
      </h1>
      <p style={{ marginBottom: 16 }}>
        Role: <strong>{role}</strong> &middot; Email:{" "}
        <strong>{user.email}</strong>
      </p>

      <button
        type="button"
        className="btn"
        style={{ marginBottom: 20 }}
        onClick={goToMyRole}
      >
        Go to my role dashboard
      </button>

      <div
        className="grid"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(0, 1fr)",
          gap: 16,
          alignItems: "flex-start",
        }}
      >
        {/* Quick actions panel */}
        <div className="panel" style={{ padding: 16 }}>
          <h3 style={{ marginBottom: 10 }}>Quick actions</h3>
          <ul style={{ paddingLeft: 18, lineHeight: 1.7 }}>
            {/* Admin / ops manager tools */}
            {(role === "admin" || role === "ops_manager") && (
              <>
                <li>
                  <Link to="/employees">Manage employees</Link>
                </li>
                <li>
                  <Link to="/events">Manage events</Link>
                </li>
                <li>
                  <Link to="/reports">Run reports</Link>
                </li>
                <li>
                  <Link to="/reports/tickets">View ticket statistics</Link>
                </li>
              </>
            )}

            {/* Animal / care tools (keeper + vet + admin/ops) */}
            {["admin", "ops_manager", "keeper", "vet"].includes(role) && (
              <>
                <li>
                  <Link to="/staff/animals">Animal records</Link>
                </li>
                <li>
                  <Link to="/animals/directory">Animal directory</Link>
                </li>
                <li>
                  <Link to="/feedings">Feeding logs</Link>
                </li>
                <li>
                  <Link to="/vetvisit">Vet visits</Link>
                </li>
              </>
            )}

            {/* Gate / ticket tools */}
            {["gate_agent", "admin", "ops_manager"].includes(role) && (
              <>
                <li>
                  <Link to="/staff/orders">Ticket & POS orders</Link>
                </li>
                <li>
                  <Link to="/reports/tickets">Daily ticket stats</Link>
                </li>
              </>
            )}

            {/* Retail tools */}
            {["retail", "admin", "ops_manager"].includes(role) && (
              <li>
                <Link to="/staff/orders">Retail orders</Link>
              </li>
            )}

            {/* Coordinator / security can get their own links later */}
            {role === "coordinator" && (
              <li>
                <Link to="/events">Event calendar</Link>
              </li>
            )}
            {role === "security" && (
              <li>
                <span>Security tools coming soon</span>
              </li>
            )}
          </ul>
        </div>

        {/* System Status panel */}
        <div className="panel" style={{ padding: 16 }}>
          <h3 style={{ marginBottom: 10 }}>System status</h3>
          <p style={{ marginBottom: 6 }}>All systems operational.</p>
          <p style={{ fontSize: 13, opacity: 0.8 }}>
            Use the quick links on the left or the “My Role” button to jump
            into your day-to-day tools.
          </p>
        </div>
      </div>
    </div>
  );
}
