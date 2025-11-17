// src/pages/employee/MedicalReports.jsx
import React, { useEffect, useState } from "react";
import { api } from "../../api";
import fetchAuth from "../../utils/fetchAuth";
import { useAuth } from "../../context/AuthContext";

const severityBg = {
  high: "#ffe4dd",
  critical: "#ffe0e0",
};

export default function MedicalReports() {
  const { token } = useAuth();
  const [days, setDays] = useState(30);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchAuth(
          `${api}/api/reports/medical-alerts?days=${encodeURIComponent(days)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (!res.ok) throw new Error("Failed to load medical alerts");
        const data = await res.json();
        setAlerts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load medical alerts report.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, days]);

  return (
    <div className="page card-page">
      <div className="card-page-inner">
        <h2 className="card-page-title">Medical Alerts Report</h2>
        <div className="card card-page-body">
          <p className="text-muted" style={{ marginBottom: 12 }}>
            Shows recent <strong>high</strong> and <strong>critical</strong>{" "}
            medical log entries across all animals.
          </p>

          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "center",
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 13, opacity: 0.8 }}>
              Time window (days):
            </span>
            <input
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) =>
                setDays(() => {
                  const v = Number(e.target.value || 0);
                  if (Number.isNaN(v) || v <= 0) return 1;
                  if (v > 365) return 365;
                  return v;
                })
              }
              style={{ width: 80, padding: 4 }}
            />
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              (1–365 days; default 30)
            </span>
          </div>

          {loading && <div>Loading alerts…</div>}
          {error && (
            <div
              style={{
                marginBottom: 10,
                padding: "8px 10px",
                borderRadius: 8,
                background: "#ffe5e5",
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {!loading && !error && alerts.length === 0 && (
            <div style={{ fontSize: 14, color: "#666" }}>
              No high or critical medical log entries in the last {days} days.
            </div>
          )}

          {!loading && alerts.length > 0 && (
            <div className="table-wrapper" style={{ marginTop: 8 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date / Time</th>
                    <th>Animal</th>
                    <th>Species</th>
                    <th>Exhibit</th>
                    <th>Severity</th>
                    <th>Summary</th>
                    <th>Vet</th>
                    <th>Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((row) => (
                    <tr key={row.log_id}>
                      <td>
                        {new Date(row.log_datetime).toLocaleString()}
                      </td>
                      <td>
                        {row.animal_name} (ID {row.animal_id})
                      </td>
                      <td>{row.species || "—"}</td>
                      <td>{row.exhibit || "—"}</td>
                      <td>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: 999,
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            fontWeight: 600,
                            backgroundColor:
                              severityBg[row.severity] || "#e0f2ff",
                          }}
                        >
                          {row.severity}
                        </span>
                      </td>
                      <td>{row.summary}</td>
                      <td>{row.vet_name || `Vet ID ${row.vet_user_id}`}</td>
                      <td>
                        {row.vet_visit_id ? `#${row.vet_visit_id}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
