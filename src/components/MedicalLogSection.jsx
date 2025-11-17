// src/components/MedicalLogSection.jsx
import React, { useEffect, useState, useMemo } from "react";
import { api } from "../api";
import fetchAuth from "../utils/fetchAuth";
import { useAuth } from "../context/AuthContext";

const severityColors = {
  info: "#e0f2ff",
  low: "#e6f4ea",
  medium: "#fff4e5",
  high: "#ffe4dd",
  critical: "#ffe0e0",
};

export default function MedicalLogSection({ animalId, recentVisits = [] }) {
  const { token, user } = useAuth();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    vet_visit_id: "",
    category: "exam",
    severity: "info",
    summary: "",
    details: "",
  });

  const canAdd =
    user && (user.role === "vet" || user.role === "admin" || user.role === "ops_manager");

  const visitOptions = useMemo(
    () =>
      recentVisits.map((v) => ({
        id: v.id || v.vet_visit_id,
        label: `${new Date(v.visit_date).toLocaleString()} – ${
          v.reason || "Visit"
        }`,
      })),
    [recentVisits]
  );

  useEffect(() => {
    if (!token || !animalId) return;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchAuth(`${api}/api/animals/${animalId}/medlogs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to load medical logs");
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Failed to load medical log entries.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [animalId, token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.summary.trim()) return;

    setSaving(true);
    setError("");
    try {
      const payload = {
        vet_visit_id: form.vet_visit_id ? Number(form.vet_visit_id) : null,
        category: form.category,
        severity: form.severity,
        summary: form.summary.trim(),
        details: form.details.trim() || null,
      };

      const res = await fetchAuth(`${api}/api/animals/${animalId}/medlogs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Create failed");
      const created = await res.json();

      setLogs((prev) => [created, ...prev]);
      setForm({
        vet_visit_id: "",
        category: "exam",
        severity: "info",
        summary: "",
        details: "",
      });
      setShowForm(false);
    } catch (err) {
      console.error(err);
      setError("Failed to save medical log entry.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid #eee" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <h2 style={{ fontSize: "1.1rem", margin: 0 }}>Medical log</h2>

        {canAdd && (
          <button
            type="button"
            className="btn btn-small"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "Cancel" : "+ Add note"}
          </button>
        )}
      </div>

      {loading && <div>Loading medical log…</div>}
      {error && <div style={{ color: "red", fontSize: "0.9rem" }}>{error}</div>}

      {showForm && canAdd && (
        <form
          onSubmit={handleSubmit}
          style={{
            marginBottom: 16,
            padding: 12,
            borderRadius: 8,
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
          }}
        >
          {visitOptions.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Link to vet visit (optional)
              </label>
              <select
                name="vet_visit_id"
                value={form.vet_visit_id}
                onChange={handleChange}
                className="input"
                style={{ width: "100%", padding: 6 }}
              >
                <option value="">— None —</option>
                {visitOptions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Category
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="input"
                style={{ width: "100%", padding: 6 }}
              >
                <option value="exam">Exam</option>
                <option value="treatment">Treatment</option>
                <option value="lab">Lab</option>
                <option value="follow_up">Follow-up</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Severity
              </label>
              <select
                name="severity"
                value={form.severity}
                onChange={handleChange}
                className="input"
                style={{ width: "100%", padding: 6 }}
              >
                <option value="info">Info</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 8 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Summary
            </label>
            <input
              name="summary"
              value={form.summary}
              onChange={handleChange}
              className="input"
              style={{ width: "100%", padding: 6 }}
              placeholder="Short headline (required)…"
              required
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Details (optional)
            </label>
            <textarea
              name="details"
              value={form.details}
              onChange={handleChange}
              rows={3}
              className="input"
              style={{ width: "100%", padding: 6, resize: "vertical" }}
              placeholder="Full note, lab values, treatment details…"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-small"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save log entry"}
          </button>
        </form>
      )}

      {!loading && logs.length === 0 && !error && (
        <div style={{ fontSize: "0.9rem", color: "#666" }}>
          No medical log entries yet for this animal.
        </div>
      )}

      {!loading && logs.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {logs.map((log) => (
            <li
              key={log.log_id}
              style={{
                padding: "10px 0",
                borderBottom: "1px solid #f0f0f0",
                fontSize: "0.9rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  marginBottom: 2,
                }}
              >
                <span style={{ fontWeight: 600 }}>
                  {new Date(log.log_datetime).toLocaleString()}
                </span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 999,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.4,
                    backgroundColor:
                      severityColors[log.severity] || severityColors.info,
                  }}
                >
                  {log.severity}
                </span>
              </div>
              <div style={{ fontWeight: 500 }}>{log.summary}</div>
              {log.details && (
                <div style={{ marginTop: 2, color: "#555" }}>{log.details}</div>
              )}
              <div style={{ marginTop: 2, fontSize: "0.75rem", color: "#777" }}>
                {log.category && `Category: ${log.category} • `}
                {log.vet_name ? `By ${log.vet_name}` : `Vet ID ${log.vet_user_id}`}
                {log.vet_visit_id && ` • Visit #${log.vet_visit_id}`}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
