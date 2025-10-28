// src/pages/customer/Exhibit.jsx
import React from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";

export default function ExhibitsPage() {
  const { token } = useAuth();
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    (async () => {
      setLoading(true); setErr("");
      try {
        // Using reports/animals-per-exhibit for public-friendly data
        const res = await fetch(`${api}/api/reports/animals-per-exhibit`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error(`Failed to load exhibits (${res.status})`);
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        setErr(e.message || "Failed to load exhibits");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <div className="page">
      <h1>Zoo Exhibits</h1>
      <div className="panel">
        {loading && <div>Loading…</div>}
        {err && <div className="error">{err}</div>}
        {!loading && !err && rows.length === 0 && <div>No exhibits to show.</div>}

        <div className="grid">
          {rows.map((r, idx) => (
            <div key={idx} className="card">
              <h3>{r.exhibit || r.name || "Exhibit"}</h3>
              <div style={{ opacity: 0.8 }}>
                Animals: <strong>{r.animal_count ?? r.count ?? 0}</strong>
              </div>
            </div>
          ))}
        </div>

        {!token && (
          <div className="note" style={{ marginTop: 12 }}>
            Public mode: showing counts only. Log in for details.
          </div>
        )}
      </div>
    </div>
  );
}
