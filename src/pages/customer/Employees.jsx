// src/pages/customer/Employees.jsx
import React from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";

export default function CEmployees() {
  const { token } = useAuth();
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    (async () => {
      setLoading(true); setErr("");
      try {
        const res = await fetch(`${api}/api/employees?limit=100`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`Failed to load employees (${res.status})`);
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || "Failed to load employees");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <div className="page">
      <h1>Our Team</h1>
      <div className="panel">
        {loading && <div>Loading…</div>}
        {err && <div className="error">{err}</div>}
        {!loading && !err && rows.length === 0 && (
          <div>No employees to show.</div>
        )}
        <div className="grid">
          {rows.map((e) => (
            <div key={e.employee_id} className="card">
              <h3 style={{ marginBottom: 4 }}>
                {e.first_name} {e.last_name}
              </h3>
              <div style={{ opacity: 0.8 }}>
                {e.role?.replaceAll("_", " ")}
              </div>
            </div>
          ))}
        </div>
        {!token && (
          <div className="note" style={{ marginTop: 12 }}>
            Data may be limited in public mode.
          </div>
        )}
      </div>
    </div>
  );
}
