// src/pages/employee/Reports.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import Toast from "../../components/Toast";

// Recharts
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell,
} from "recharts";

// Reusable stat card
function StatCard({ label, value, hint }) {
  return (
    <div className="card" style={{ padding: 16, minWidth: 180 }}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{value}</div>
      {hint ? <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{hint}</div> : null}
    </div>
  );
}

// Utility: format cents to dollars
function toCurrency(cents) {
  const n = Number(cents || 0) / 100;
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

// Utility: quick CSV exporter
function downloadCsv(filename, rows) {
  const csv = rows.map(r =>
    r.map((cell) => {
      const v = cell ?? "";
      const needsQuote = /[",\n]/.test(String(v));
      const cleaned = String(v).replace(/"/g, '""');
      return needsQuote ? `"${cleaned}"` : cleaned;
    }).join(",")
  ).join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Reports() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState({ open: false, type: "success", text: "" });
  const showToast = (type, text) => setToast({ open: true, type, text });

  const [employees, setEmployees] = useState([]);
  const [animals, setAnimals] = useState([]);

  useEffect(() => { load(); }, []);
  async function load() {
    setLoading(true); setErr("");
    try {
      const [er, ar] = await Promise.all([
        fetch(`${api}/api/employees`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${api}/api/animals`,   { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [eData, aData] = await Promise.all([er.json(), ar.json()]);
      if (!er.ok) throw new Error(eData?.error || "Failed to load employees");
      if (!ar.ok) throw new Error(aData?.error || "Failed to load animals");

      setEmployees(eData || []);
      setAnimals(aData || []);
    } catch (e) {
      const msg = e.message || "Failed to load reports";
      setErr(msg);
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  // --- Aggregations ---
  const headcountByRole = useMemo(() => {
    const m = new Map();
    for (const e of employees) {
      const k = e.role || "unknown";
      m.set(k, (m.get(k) || 0) + 1);
    }
    return Array.from(m.entries()).sort((a,b) => a[0].localeCompare(b[0]));
  }, [employees]);

  const activeBreakdown = useMemo(() => {
    let active = 0, inactive = 0;
    for (const e of employees) (Number(e.is_active) ? active++ : inactive++);
    return { active, inactive, total: active + inactive };
  }, [employees]);

  const totalPayrollCents = useMemo(() => {
    let sum = 0;
    for (const e of employees) {
      const n = Number(e.salary_cents);
      if (!Number.isNaN(n)) sum += n;
    }
    return sum;
  }, [employees]);

  const animalsByExhibit = useMemo(() => {
    const m = new Map();
    for (const a of animals) {
      const k = (a.exhibit_id != null ? `Exhibit ${a.exhibit_id}` : (a.species || "Unknown"));
      m.set(k, (m.get(k) || 0) + 1);
    }
    return Array.from(m.entries()).sort((a,b) => a[0].localeCompare(b[0]));
  }, [animals]);

  // --- Chart data ---
  const roleChartData = useMemo(
    () => headcountByRole.map(([role, count]) => ({ role, count })),
    [headcountByRole]
  );
  const activePieData = useMemo(
    () => [
      { name: "Active", value: activeBreakdown.active },
      { name: "Inactive", value: activeBreakdown.inactive },
    ],
    [activeBreakdown]
  );
  const animalsChartData = useMemo(
    () => animalsByExhibit.map(([group, count]) => ({ group, count })),
    [animalsByExhibit]
  );

  // --- CSV builders ---
  function exportRolesCsv() {
    const rows = [["Role", "Count"], ...headcountByRole.map(([role, count]) => [role, count])];
    downloadCsv("employees_by_role.csv", rows);
  }
  function exportActiveCsv() {
    const { active, inactive, total } = activeBreakdown;
    const rows = [["Status", "Count"], ["Active", active], ["Inactive", inactive], ["Total", total]];
    downloadCsv("employees_active_breakdown.csv", rows);
  }
  function exportPayrollCsv() {
    const rows = [["Metric", "Value"], ["Total Payroll (USD)", toCurrency(totalPayrollCents)]];
    downloadCsv("total_payroll.csv", rows);
  }
  function exportAnimalsCsv() {
    const rows = [["Group", "Count"], ...animalsByExhibit.map(([k, count]) => [k, count])];
    downloadCsv("animals_by_group.csv", rows);
  }

  // Colors for charts (kept simple)
  const COLORS = ["#2e7d32", "#a1887f", "#1565c0", "#ef6c00", "#6a1b9a", "#00838f", "#ad1457"];

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Reports</h2>
        <button className="btn btn-sm" onClick={load}>Refresh</button>
      </div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : (
        <>
          {/* Top stats */}
          <div className="row" style={{ gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <StatCard label="Total Employees" value={employees.length} />
            <StatCard label="Active Employees" value={activeBreakdown.active} />
            <StatCard label="Inactive Employees" value={activeBreakdown.inactive} />
            <StatCard label="Total Payroll" value={toCurrency(totalPayrollCents)} hint="(sum of salary_cents)" />
            <StatCard label="Total Animals" value={animals.length} />
          </div>

          {/* Employees by Role */}
          <div className="card card--wide" style={{ marginBottom: 16 }}>
            <div className="row-between" style={{ marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Employees by Role</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-sm" onClick={exportRolesCsv}>Export CSV</button>
              </div>
            </div>

            <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 280, height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roleChartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count">
                      {roleChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ flex: 1, minWidth: 280 }}>
                <table className="table" style={{ width: "100%" }}>
                  <thead>
                    <tr><th>Role</th><th style={{ width: 120, textAlign: "right" }}>Count</th></tr>
                  </thead>
                  <tbody>
                    {headcountByRole.map(([role, count]) => (
                      <tr key={role}>
                        <td>{role}</td>
                        <td style={{ textAlign: "right" }}>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Active vs Inactive */}
          <div className="card card--wide" style={{ marginBottom: 16 }}>
            <div className="row-between" style={{ marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Active vs Inactive Employees</h3>
              <button className="btn btn-sm" onClick={exportActiveCsv}>Export CSV</button>
            </div>

            <div className="row" style={{ gap: 16, flexWrap: "wrap", alignItems: "stretch" }}>
              <div style={{ flex: 1, minWidth: 280, height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={activePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
                      {activePieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ flex: 1, minWidth: 280 }}>
                <table className="table" style={{ width: "100%" }}>
                  <thead>
                    <tr><th>Status</th><th style={{ width: 120, textAlign: "right" }}>Count</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Active</td><td style={{ textAlign: "right" }}>{activeBreakdown.active}</td></tr>
                    <tr><td>Inactive</td><td style={{ textAlign: "right" }}>{activeBreakdown.inactive}</td></tr>
                    <tr><td><strong>Total</strong></td><td style={{ textAlign: "right" }}><strong>{activeBreakdown.total}</strong></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Animals by Exhibit/Group */}
          <div className="card card--wide" style={{ marginBottom: 16 }}>
            <div className="row-between" style={{ marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Animals by Exhibit/Group</h3>
              <button className="btn btn-sm" onClick={exportAnimalsCsv}>Export CSV</button>
            </div>

            <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 280, height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={animalsChartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="group" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count">
                      {animalsChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ flex: 1, minWidth: 280 }}>
                <table className="table" style={{ width: "100%" }}>
                  <thead>
                    <tr><th>Exhibit / Group</th><th style={{ width: 120, textAlign: "right" }}>Count</th></tr>
                  </thead>
                  <tbody>
                    {animalsByExhibit.map(([k, count]) => (
                      <tr key={k}><td>{k}</td><td style={{ textAlign: "right" }}>{count}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Payroll section */}
          <div className="card card--wide" style={{ marginBottom: 16 }}>
            <div className="row-between" style={{ marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Payroll</h3>
              <button className="btn btn-sm" onClick={exportPayrollCsv}>Export CSV</button>
            </div>
            <div>Total Payroll: <strong>{toCurrency(totalPayrollCents)}</strong></div>
            <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 6 }}>
              * Calculated from <code>salary_cents</code>; employees without a salary are excluded.
            </div>
          </div>
        </>
      )}

      {toast.open && <Toast {...toast} onClose={() => setToast({ ...toast, open: false })} />}
    </div>
  );
}
