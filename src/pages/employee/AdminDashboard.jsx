// src/pages/employee/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext";
import fetchAuth from "../../utils/fetchAuth";

const toUSD = (cents) =>
  (Number(cents || 0) / 100).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

export default function AdminDashboard() {
  const { token, user } = useAuth(); // user has name + role in your auth
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [employeeCount, setEmployeeCount] = useState(0);
  const [eventCount, setEventCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [todayRevenueCents, setTodayRevenueCents] = useState(0);

  useEffect(() => {
    if (!token) return;

    async function load() {
      setLoading(true);
      setErr("");

      try {
        // Employees
        const empRes = await fetchAuth(`${api}/api/employees`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!empRes.ok) throw new Error("Failed to load employees");
        const employees = await empRes.json();
        setEmployeeCount(Array.isArray(employees) ? employees.length : 0);

        // Events
        const evRes = await fetchAuth(`${api}/api/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!evRes.ok) throw new Error("Failed to load events");
        const events = await evRes.json();
        setEventCount(Array.isArray(events) ? events.length : 0);

        // Orders (staff endpoint)
        const ordRes = await fetchAuth(`${api}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!ordRes.ok) throw new Error("Failed to load orders");
        const orders = await ordRes.json();

        if (Array.isArray(orders)) {
          setOrderCount(orders.length);
          const pending = orders.filter(
            (o) => String(o.status || "").toLowerCase() === "pending"
          ).length;
          setPendingOrders(pending);

          // "Today" revenue from these recent orders only
          const todayStr = new Date().toISOString().slice(0, 10);
          const todayTotal = orders.reduce((sum, o) => {
            const vdate = o.visit_date
              ? new Date(o.visit_date).toISOString().slice(0, 10)
              : "";
            if (vdate === todayStr) {
              return sum + (Number(o.total_cents) || 0);
            }
            return sum;
          }, 0);
          setTodayRevenueCents(todayTotal);
        }
      } catch (e) {
        console.error(e);
        setErr(e.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token]);

  return (
    <div className="page card-page">
      <div className="card-page-inner">
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            alignItems: "flex-end",
            marginBottom: 16,
          }}
        >
          <div>
            <h2 className="card-page-title" style={{ marginBottom: 4 }}>
              Admin Dashboard
            </h2>
            <div style={{ fontSize: "0.9rem", color: "#555" }}>
              Welcome back{user?.name ? `, ${user.name}` : ""}! You are logged
              in as <strong>{user?.role || "admin"}</strong>.
            </div>
          </div>

          <div style={{ textAlign: "right", fontSize: "0.8rem", color: "#777" }}>
            <div>Last refreshed just now</div>
            {loading && <div>Loading data…</div>}
          </div>
        </div>

        {err && (
          <div
            className="error"
            style={{ marginBottom: 16, padding: 8, borderRadius: 8 }}
          >
            {err}
          </div>
        )}

        {/* Top summary cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontSize: "0.8rem", color: "#777" }}>Employees</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 600 }}>
              {employeeCount}
            </div>
            <div style={{ fontSize: "0.8rem", marginTop: 4 }}>
              Active staff in the system.
            </div>
          </div>

          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontSize: "0.8rem", color: "#777" }}>Events</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 600 }}>
              {eventCount}
            </div>
            <div style={{ fontSize: "0.8rem", marginTop: 4 }}>
              Zoo events configured.
            </div>
          </div>

          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontSize: "0.8rem", color: "#777" }}>Recent orders</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 600 }}>
              {orderCount}
            </div>
            <div style={{ fontSize: "0.8rem", marginTop: 4 }}>
              {pendingOrders} pending refunds / visits.
            </div>
          </div>

          <div className="card" style={{ padding: 12 }}>
            <div style={{ fontSize: "0.8rem", color: "#777" }}>Today’s revenue*</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 600 }}>
              {toUSD(todayRevenueCents)}
            </div>
            <div style={{ fontSize: "0.75rem", marginTop: 4, color: "#777" }}>
              *From the most recent orders list (not full accounting).
            </div>
          </div>
        </div>

        {/* Two-column layout: Quick links + role notes */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2.1fr) minmax(260px, 1.2fr)",
            gap: 16,
          }}
        >
          {/* LEFT: Quick links & workflows */}
          <div className="card" style={{ padding: 14 }}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: 8,
                fontSize: "0.98rem",
                fontWeight: 600,
              }}
            >
              Quick admin actions
            </h3>
            <p
              style={{
                fontSize: "0.85rem",
                color: "#555",
                marginTop: 0,
                marginBottom: 10,
              }}
            >
              Jump straight into the tools you use most. These are the same
              sections from the nav, but grouped by workflow.
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: 10,
              }}
            >
              <Link to="/employees" className="card quick-link-card">
                <div style={{ padding: 10 }}>
                  <div
                    style={{ fontSize: "0.8rem", textTransform: "uppercase" }}
                  >
                    People
                  </div>
                  <div style={{ fontWeight: 600 }}>Manage employees</div>
                  <div style={{ fontSize: "0.8rem", color: "#777" }}>
                    Add staff, edit roles, reset accounts.
                  </div>
                </div>
              </Link>

              <Link to="/events" className="card quick-link-card">
                <div style={{ padding: 10 }}>
                  <div
                    style={{ fontSize: "0.8rem", textTransform: "uppercase" }}
                  >
                    Programming
                  </div>
                  <div style={{ fontWeight: 600 }}>Manage events</div>
                  <div style={{ fontSize: "0.8rem", color: "#777" }}>
                    Create new events, edit details, or deactivate.
                  </div>
                </div>
              </Link>

              <Link to="/reports" className="card quick-link-card">
                <div style={{ padding: 10 }}>
                  <div
                    style={{ fontSize: "0.8rem", textTransform: "uppercase" }}
                  >
                    Insights
                  </div>
                  <div style={{ fontWeight: 600 }}>Run reports</div>
                  <div style={{ fontSize: "0.8rem", color: "#777" }}>
                    Membership, ticket, finance, and medical reports.
                  </div>
                </div>
              </Link>

              <Link to="/staff/orders" className="card quick-link-card">
                <div style={{ padding: 10 }}>
                  <div
                    style={{ fontSize: "0.8rem", textTransform: "uppercase" }}
                  >
                    Revenue
                  </div>
                  <div style={{ fontWeight: 600 }}>Ticket & POS orders</div>
                  <div style={{ fontSize: "0.8rem", color: "#777" }}>
                    Look up orders, process refunds, and check totals.
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* RIGHT: Role information / status */}
          <div className="card" style={{ padding: 14 }}>
            <h3
              style={{
                marginTop: 0,
                marginBottom: 8,
                fontSize: "0.98rem",
                fontWeight: 600,
              }}
            >
              Admin role overview
            </h3>
            <p style={{ fontSize: "0.85rem", color: "#555", marginTop: 0 }}>
              As an <strong>admin</strong> you can:
            </p>
            <ul
              style={{
                paddingLeft: 18,
                marginTop: 0,
                marginBottom: 8,
                fontSize: "0.85rem",
              }}
            >
              <li>Manage employees and their roles.</li>
              <li>Create and update public-facing events and pricing.</li>
              <li>View financial and operational reports.</li>
              <li>Approve or perform order refunds.</li>
            </ul>
            <p style={{ fontSize: "0.8rem", color: "#777" }}>
              Use the quick links on the left, or the main navigation bar, to
              move between these areas. The dashboard above gives you a
              high-level snapshot so you can see what might need attention
              first.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
