// src/pages/customer/Exhibit.jsx
import React from "react";
import { api } from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Exhibits() {
  const { token } = useAuth();
  const [isPublic, setIsPublic] = React.useState(false);
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState("");

  React.useEffect(() => {
    (async () => {
      setLoading(true); setErr("");
      try {
        let data;
        if (!token) {
          // Logged-out: go straight to public
          const res = await fetch(`${api}/api/public/animals-per-exhibit`);
          if (!res.ok) throw new Error(`Failed to load exhibits (${res.status})`);
          data = await res.json();
          setIsPublic(true);
        } else {
          // Logged-in: try protected first, then fall back
          let res = await fetch(`${api}/api/reports/animals-per-exhibit`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.status === 401 || res.status === 403) {
            res = await fetch(`${api}/api/public/animals-per-exhibit`);
            if (!res.ok) throw new Error(`Failed to load exhibits (${res.status})`);
            data = await res.json();
            setIsPublic(true);
          } else {
            if (!res.ok) throw new Error(`Failed to load exhibits (${res.status})`);
            data = await res.json();
            setIsPublic(false);
          }
        }
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
        {!loading && !err && rows.length === 0 && (
          <div>No exhibits found.</div>
        )}

        <div className="grid">
          {rows.map((r, i) => (
            <div key={i} className="card">
              <h3 style={{ marginBottom: 4 }}>{r.exhibit || "Exhibit"}</h3>
              <div style={{ opacity: 0.8, fontSize: 14 }}>
                Animals: <strong>{r.animal_count ?? 0}</strong>
              </div>
            </div>
          ))}
        </div>

        {isPublic && (
          <div className="note">
            Public mode: showing counts only. Log in for details.
          </div>
        )}
      </div>
    </div>
  );
}
