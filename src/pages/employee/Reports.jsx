// src/pages/employee/Reports.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";
import Toast from "../../components/Toast";
import JSZip from "jszip";

// Recharts
import {
  ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList,
  PieChart, Pie, Cell,
} from "recharts";

// ---------- Small UI helpers ----------
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

function downloadCsv(filename, rows) {
  const csv = rows
    .map((r) =>
      r
        .map((cell) => {
          const v = cell ?? "";
          const needsQuote = /[",\n]/.test(String(v));
          const cleaned = String(v).replace(/"/g, '""');
          return needsQuote ? `"${cleaned}"` : cleaned;
        })
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Try to pick a date from a record using common field names.
// If no date field exists, return null (record will not be filtered by date).
function pickDate(obj) {
  const candidates = [
    "hire_date",
    "hired_at",
    "created_at",
    "createdAt",
    "intake_date",
    "date",
  ];
  for (const k of candidates) {
    if (obj && obj[k]) {
      const d = new Date(obj[k]);
      if (!Number.isNaN(d.valueOf())) return d;
    }
  }
  return null;
}

export default function Reports() {
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const [err, setErr] = useState("");
  const [toast, setToast] = useState({ open: false, type: "success", text: "" });
  const showToast = (type, text) => setToast({ open: true, type, text });

  const [employees, setEmployees] = useState([]);
  const [animals, setAnimals] = useState([]);

  // Date filter (optional; records without a date are included)
  const [from, setFrom] = useState(""); // yyyy-mm-dd
  const [to, setTo] = useState("");     // yyyy-mm-dd

  // Nice spinner for Refresh button
  const Spinner = () => (
    <span
      aria-hidden
      style={{
        width: 14,
        height: 14,
        border: "2px solid #fff",
        borderTopColor: "transparent",
        borderRadius: "50%",
        display: "inline-block",
        verticalAlign: "middle",
        marginRight: 6,
        animation: "spin 0.8s linear infinite",
      }}
    />
  );

  // inject the keyframes once
  useEffect(() => {
    const styleId = "reports-spin-style";
    if (!document.getElementById(styleId)) {
      const s = document.createElement("style");
      s.id = styleId;
      s.textContent = "@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}";
      document.head.appendChild(s);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const [er, ar] = await Promise.all([
        fetch(`${api}/api/employees`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${api}/api/animals`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [eData, aData] = await Promise.all([er.json(), ar.json()]);
      if (!er.ok) throw new Error(eData?.error || "Failed to load employees");
      if (!ar.ok) throw new Error(aData?.error || "Failed to load animals");

      setEmployees(eData || []);
      setAnimals(aData || []);
      setLastUpdated(new Date().toLocaleString());
    } catch (e) {
      const msg = e.message || "Failed to load reports";
      setErr(msg);
      showToast("error", msg);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    try {
      setRefreshing(true);
      await load();
      showToast("success", "Reports refreshed");
    } finally {
      setRefreshing(false);
    }
  }

  // --- Apply Date Filter (non-destructive) ---
  const fromDate = useMemo(() => (from ? new Date(from + "T00:00:00") : null), [from]);
  const toDate = useMemo(() => (to ? new Date(to + "T23:59:59") : null), [to]);

  function withinRange(d) {
    if (!d) return true; // if no date on record, include
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  }

  const employeesFiltered = useMemo(() => {
    return employees.filter((e) => withinRange(pickDate(e)));
  }, [employees, fromDate, toDate]);

  const animalsFiltered = useMemo(() => {
    return animals.filter((a) => withinRange(pickDate(a)));
  }, [animals, fromDate, toDate]);

  // --- Aggregations (on filtered sets) ---
  const headcountByRole = useMemo(() => {
    const m = new Map();
    for (const e of employeesFiltered) {
      const k = e.role || "unknown";
      m.set(k, (m.get(k) || 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [employeesFiltered]);

  const activeBreakdown = useMemo(() => {
    let active = 0,
      inactive = 0;
    for (const e of employeesFiltered) (Number(e.is_active) ? active++ : inactive++);
    return { active, inactive, total: active + inactive };
  }, [employeesFiltered]);

  const totalPayrollCents = useMemo(() => {
    let sum = 0;
    for (const e of employeesFiltered) {
      const n = Number(e.salary_cents);
      if (!Number.isNaN(n)) sum += n;
    }
    return sum;
  }, [employeesFiltered]);

  const animalsByExhibit = useMemo(() => {
    const m = new Map();
    for (const a of animalsFiltered) {
      const k =
        a.exhibit_id != null ? `Exhibit ${a.exhibit_id}` : a.species || "Unknown";
      m.set(k, (m.get(k) || 0) + 1);
    }
    return Array.from(m.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [animalsFiltered]);

  // --- Chart data (+ percentages in labels/tooltips) ---
  const roleChartData = useMemo(
    () => headcountByRole.map(([role, count]) => ({ role, count })),
    [headcountByRole]
  );

  const activePieData = useMemo(() => {
    const { active, inactive, total } = activeBreakdown;
    const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
    return [
      { name: `Active (${pct(active)}%)`, value: active, raw: active },
      { name: `Inactive (${pct(inactive)}%)`, value: inactive, raw: inactive },
    ];
  }, [activeBreakdown]);

  const animalsChartData = useMemo(
    () => animalsByExhibit.map(([group, count]) => ({ group, count })),
    [animalsByExhibit]
  );

  // --- CSV builders (filtered data) ---
  function exportRolesCsv() {
    const rows = [["Role", "Count"], ...headcountByRole.map(([role, count]) => [role, count])];
    downloadCsv("employees_by_role.csv", rows);
  }
  function exportActiveCsv() {
    const { active, inactive, total } = activeBreakdown;
    const rows = [
      ["Status", "Count"],
      ["Active", active],
      ["Inactive", inactive],
      ["Total", total],
    ];
    downloadCsv("employees_active_breakdown.csv", rows);
  }
  function exportPayrollCsv() {
    const rows = [
      ["Metric", "Value"],
      ["Total Payroll (USD)", toCurrency(totalPayrollCents)],
      ["Total Payroll (cents)", totalPayrollCents],
    ];
    downloadCsv("total_payroll.csv", rows);
  }
  function exportAnimalsCsv() {
    const rows = [["Group", "Count"], ...animalsByExhibit.map(([k, count]) => [k, count])];
    downloadCsv("animals_by_group.csv", rows);
  }

  // ---- Export All (ZIP) ----
  async function exportAllZip() {
    try {
      const zip = new JSZip();

      const roles = [["Role", "Count"], ...headcountByRole.map(([r, c]) => [r, c])];
      const active = [
        ["Status", "Count"],
        ["Active", activeBreakdown.active],
        ["Inactive", activeBreakdown.inactive],
        ["Total", activeBreakdown.total],
      ];
      const payroll = [
        ["Metric", "Value"],
        ["Total Payroll (USD)", toCurrency(totalPayrollCents)],
        ["Total Payroll (cents)", totalPayrollCents],
      ];
      const animalsRows = [["Group", "Count"], ...animalsByExhibit.map(([g, c]) => [g, c])];

      const makeCsv = (rows) =>
        rows
          .map((r) =>
            r
              .map((cell) => {
                const v = cell ?? "";
                const needsQuote = /[",\n]/.test(String(v));
                const cleaned = String(v).replace(/"/g, '""');
                return needsQuote ? `"${cleaned}"` : cleaned;
              })
              .join(",")
          )
          .join("\n");

      zip.file("employees_by_role.csv", makeCsv(roles));
      zip.file("employees_active_breakdown.csv", makeCsv(active));
      zip.file("total_payroll.csv", makeCsv(payroll));
      zip.file("animals_by_group.csv", makeCsv(animalsRows));

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "zooapp_reports.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      showToast("error", "ZIP export failed");
    }
  }

  const COLORS = ["#2e7d32", "#a1887f", "#1565c0", "#ef6c00", "#6a1b9a", "#00838f", "#ad1457"];

  // percentage helper for tooltips
  const percent = (n, total) => (total ? `${Math.round((n / total) * 100)}%` : "0%");

  return (
    <div className="page">
      <div className="row-between" style={{ marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>Reports</h2>
          {lastUpdated && (
            <div style={{ color: "var(--muted)", fontSize: 12 }}>
              Last updated: {lastUpdated}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-sm" onClick={exportAllZip} title="Download all CSVs as a ZIP">
            Export All (ZIP)
          </button>
          <button
            className="btn btn-sm"
            onClick={refresh}
            disabled={refreshing}
            aria-busy={refreshing}
            title="Refresh reports"
          >
            {refreshing && <Spinner />} Refresh
          </button>
        </div>
      </div>

      {/* Date Filter */}
      <div className="card" style={{ padding: 12, marginBottom: 12 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Date Filter (optional)</div>
        <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--muted)" }}>From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, color: "var(--muted)" }}>To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div style={{ alignSelf: "flex-end" }}>
            <button
              className="btn btn-sm"
              onClick={() => {
                setFrom("");
                setTo("");
              }}
            >
              Clear
            </button>
          </div>
          <div style={{ color: "var(--muted)", fontSize: 12, alignSelf: "flex-end" }}>
            * Filters apply when records contain a date (e.g., hire_date, created_at).
          </div>
        </div>
      </div>

      {err && <div className="error" style={{ marginBottom: 12 }}>{err}</div>}

      {loading ? (
        <div>Loading…</div>
      ) : (
        <>
        {employeesFiltered.length === 0 && (
          <div style={{ color: "var(--muted)", marginBottom: 12 }}>
            No employee data to display.
          </div>
        )}
        {animalsFiltered.length === 0 && (
          <div style={{ color: "var(--muted)", marginBottom: 12 }}>
            No animal data to display.
          </div>
        )}
          {/* Top stats (payroll has cents tooltip for debugging) */}
          <div className="row" style={{ gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <StatCard label="Total Employees" value={employeesFiltered.length} />
            <StatCard label="Active Employees" value={activeBreakdown.active} />
            <StatCard label="Inactive Employees" value={activeBreakdown.inactive} />
            <StatCard
              label="Total Payroll"
              value={toCurrency(totalPayrollCents)}
              hint="(sum of salary_cents)"
              title={`Total payroll (cents): ${totalPayrollCents.toLocaleString()}`}
            />
            <StatCard label="Total Animals" value={animalsFiltered.length} />
          </div>

          {/* Employees by Role */}
          <div className="card card--wide" style={{ marginBottom: 16 }}>
            <div className="row-between" style={{ marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>
                Employees by Role{" "}
                <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 12 }}>
                  (total {employeesFiltered.length})
                </span>
              </h3>
              <button className="btn btn-sm" onClick={exportRolesCsv}>Export CSV</button>
            </div>

            <div className="row" style={{ gap: 16, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 280, height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roleChartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role" />
                    <YAxis allowDecimals={false} />
                    <Tooltip
                      formatter={(value) => [`${value}`, "Count"]}
                      labelFormatter={(role) => `Role: ${role}`}
                    />
                    <Bar dataKey="count">
                      {roleChartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                      <LabelList dataKey="count" position="top" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ flex: 1, minWidth: 280 }}>
                <table className="table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th style={{ width: 120, textAlign: "right" }}>Count</th>
                    </tr>
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
              <h3 style={{ margin: 0 }}>
                Active vs Inactive Employees{" "}
                <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 12 }}>
                  (total {activeBreakdown.total})
                </span>
              </h3>
              <button className="btn btn-sm" onClick={exportActiveCsv}>Export CSV</button>
            </div>

            <div className="row" style={{ gap: 16, flexWrap: "wrap", alignItems: "stretch" }}>
              <div style={{ flex: 1, minWidth: 280, height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={activePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={(d) => `${d.name}`}
                    >
                      {activePieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(_, idx) => {
                        const total = activeBreakdown.total;
                        const raw = activePieData[idx]?.raw ?? 0;
                        return [`${raw} (${percent(raw, total)})`, "Employees"];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ flex: 1, minWidth: 280 }}>
                <table className="table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th style={{ width: 120, textAlign: "right" }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Active</td>
                      <td style={{ textAlign: "right" }}>{activeBreakdown.active}</td>
                    </tr>
                    <tr>
                      <td>Inactive</td>
                      <td style={{ textAlign: "right" }}>{activeBreakdown.inactive}</td>
                    </tr>
                    <tr>
                      <td><strong>Total</strong></td>
                      <td style={{ textAlign: "right" }}>
                        <strong>{activeBreakdown.total}</strong>
                      </td>
                    </tr>
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
                    <Tooltip formatter={(value) => [`${value}`, "Count"]} />
                    <Bar dataKey="count">
                      {animalsChartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                      <LabelList dataKey="count" position="top" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ flex: 1, minWidth: 280 }}>
                <table className="table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>Exhibit / Group</th>
                      <th style={{ width: 120, textAlign: "right" }}>Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {animalsByExhibit.map(([k, count]) => (
                      <tr key={k}>
                        <td>{k}</td>
                        <td style={{ textAlign: "right" }}>{count}</td>
                      </tr>
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
            <div>
              Total Payroll:{" "}
              <strong title={`Total payroll (cents): ${totalPayrollCents.toLocaleString()}`}>
                {toCurrency(totalPayrollCents)}
              </strong>
            </div>
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
