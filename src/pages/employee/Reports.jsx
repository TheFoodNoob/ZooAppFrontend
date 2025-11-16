// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import Toast from "../../components/Toast";
import JSZip from "jszip";
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList, Cell,
  PieChart, Pie
} from "recharts";

// ---------- Helpers ----------
function StatCard({ label, value, hint, title }) {
  return (
    <div className="card" title={title} style={{ padding: 16, minWidth: 180 }}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{value}</div>
      {hint ? <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{hint}</div> : null}
    </div>
  );
}

function toCurrency(cents) {
  const n = Number(cents || 0) / 100;
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function pickDate(obj) {
  const candidates = ["hire_date", "hired_at", "created_at", "createdAt", "intake_date", "date"];
  for (const k of candidates) {
    if (obj && obj[k]) {
      const d = new Date(obj[k]);
      if (!Number.isNaN(d.valueOf())) return d;
    }
  }
  return null;
}

// ---------- Dashboard ----------
export default function Dashboard() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState({ open: false, type: "success", text: "" });
  const showToast = (type, text) => setToast({ open: true, type, text });

  const [employees, setEmployees] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [totalSold, setTotalSold] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const [activeTab, setActiveTab] = useState("employees"); // employees | animals | tickets

  // ---------- Load data ----------
  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      setErr("");
      try {
        const [er, ar, tr] = await Promise.all([
          fetch(`${api}/api/employees`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${api}/api/animals`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${api}/api/public/ticket-types`)
        ]);

        const [eData, aData, tData] = await Promise.all([er.json(), ar.json(), tr.json()]);
        if (!er.ok) throw new Error(eData?.error || "Failed to load employees");
        if (!ar.ok) throw new Error(aData?.error || "Failed to load animals");
        if (!tr.ok) throw new Error(tData?.error || "Failed to load tickets");

        setEmployees(eData || []);
        setAnimals(aData || []);

        // Compute ticket stats
        let sold = 0, revenue = 0;
        const ticketStats = tData.map(t => {
          const quantity = Math.floor(Math.random() * 50) + 10; // placeholder
          const price = t.price_cents / 100;
          sold += quantity;
          revenue += quantity * price;
          return { name: t.name, quantity, revenue: quantity * price };
        });
        setTickets(ticketStats);
        setTotalSold(sold);
        setTotalRevenue(revenue);

      } catch (e) {
        setErr(e.message || "Failed to load reports");
        showToast("error", e.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, [token]);

  // ---------- Employee aggregations ----------
  const headcountByRole = useMemo(() => {
    const m = new Map();
    for (const e of employees) {
      const k = e.role || "unknown";
      m.set(k, (m.get(k) || 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [employees]);

  const activeBreakdown = useMemo(() => {
    let active = 0, inactive = 0;
    for (const e of employees) (Number(e.is_active) ? active++ : inactive++);
    return { active, inactive, total: active + inactive };
  }, [employees]);

  const totalPayrollCents = useMemo(() => {
    return employees.reduce((sum, e) => sum + (Number(e.salary_cents) || 0), 0);
  }, [employees]);

  // ---------- Animals aggregations ----------
  const animalsByExhibit = useMemo(() => {
    const m = new Map();
    for (const a of animals) {
      const k = a.exhibit_id != null ? `Exhibit ${a.exhibit_id}` : a.species || "Unknown";
      m.set(k, (m.get(k) || 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [animals]);

  const COLORS = ["#2e7d32", "#a1887f", "#1565c0", "#ef6c00", "#6a1b9a", "#00838f", "#ad1457"];
  const percent = (n, total) => (total ? `${Math.round((n / total) * 100)}%` : "0%");

  if (loading) return <p>Loading reports...</p>;
  if (err) return <p>Error: {err}</p>;

  return (
    <div className="page">
      <h1>Zoo Dashboard</h1>
      {/* Tabs */}
      <div style={{ marginBottom: 16, display: "flex", gap: 8 }}>
        <button className={activeTab === "employees" ? "btn btn-primary" : "btn"} onClick={() => setActiveTab("employees")}>Employees</button>
        <button className={activeTab === "animals" ? "btn btn-primary" : "btn"} onClick={() => setActiveTab("animals")}>Animals</button>
        <button className={activeTab === "tickets" ? "btn btn-primary" : "btn"} onClick={() => setActiveTab("tickets")}>Tickets</button>
      </div>

      {/* Employee Tab */}
      {activeTab === "employees" && (
        <>
          <div className="row" style={{ gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <StatCard label="Total Employees" value={employees.length} />
            <StatCard label="Active Employees" value={activeBreakdown.active} />
            <StatCard label="Inactive Employees" value={activeBreakdown.inactive} />
            <StatCard label="Total Payroll" value={toCurrency(totalPayrollCents)} hint="(sum of salary_cents)" />
          </div>

          <h3>Employees by Role</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={headcountByRole.map(([role, count]) => ({ role, count }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="role" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value) => [`${value}`, "Count"]} />
              <Bar dataKey="count">
                {headcountByRole.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
                <LabelList dataKey="count" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <h3>Active vs Inactive</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: `Active (${percent(activeBreakdown.active, activeBreakdown.total)})`, value: activeBreakdown.active },
                  { name: `Inactive (${percent(activeBreakdown.inactive, activeBreakdown.total)})`, value: activeBreakdown.inactive }
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={(d) => d.name}
              >
                <Cell fill="#2e7d32" />
                <Cell fill="#a1887f" />
              </Pie>
              <Tooltip formatter={(value, _, props) => [`${value}`, "Employees"]} />
            </PieChart>
          </ResponsiveContainer>
        </>
      )}

      {/* Animals Tab */}
      {activeTab === "animals" && (
        <>
          <h3>Animals by Exhibit/Group</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={animalsByExhibit.map(([group, count]) => ({ group, count }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="group" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value) => [`${value}`, "Count"]} />
              <Bar dataKey="count">
                {animalsByExhibit.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
                <LabelList dataKey="count" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      {/* Tickets Tab */}
      {activeTab === "tickets" && (
        <>
          <div className="stats-grid" style={{ display: "flex", gap: "2rem", marginBottom: "2rem" }}>
            <StatCard label="Total Tickets Sold" value={totalSold} />
            <StatCard label="Total Revenue" value={`$${totalRevenue.toFixed(2)}`} />
          </div>

          <h3>Tickets Sold per Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tickets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Bar dataKey="quantity" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>

          <h3>Revenue per Ticket Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tickets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
              <Bar dataKey="revenue" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}

      {toast.open && <Toast {...toast} onClose={() => setToast({ ...toast, open: false })} />}
    </div>
  );
}
